
// Smart Lottery Analyzer App (Pick 3, 4, 5 Support)
// Includes: Sum Frequencies, Digit Heat Map, Local Storage Support

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const getSum = (combo) => combo.reduce((a, b) => a + b, 0);
const getPairs = (combo) => {
  const pairs = [];
  for (let i = 0; i < combo.length; i++) {
    for (let j = i + 1; j < combo.length; j++) {
      pairs.push(`${combo[i]}${combo[j]}`);
    }
  }
  return pairs;
};

const LotteryAnalyzerApp = () => {
  const [history, setHistory] = useState([]);
  const [smartPicks, setSmartPicks] = useState([]);
  const [overdueSums, setOverdueSums] = useState([]);
  const [overduePairs, setOverduePairs] = useState([]);
  const [positionMap, setPositionMap] = useState([]);
  const [sumFrequencies, setSumFrequencies] = useState({});
  const [comboLength, setComboLength] = useState(4); // default to Pick 4

  useEffect(() => {
    const saved = localStorage.getItem("lotteryHistory");
    const savedLen = localStorage.getItem("comboLength");
    if (saved) {
      const draws = JSON.parse(saved);
      const len = savedLen ? parseInt(savedLen) : 4;
      setComboLength(len);
      setHistory(draws);
      analyzeHistory(draws, len);
    }
  }, []);

  const parseHistory = (text, length) => {
    return text
      .split("\n")
      .map(line => line.trim())
      .filter(line => new RegExp(`^\\d{${length}}$`).test(line))
      .map(draw => draw.split("").map(Number));
  };

  const analyzeHistory = (draws, length) => {
    const sumMap = {}, pairMap = {}, posMap = Array.from({ length }, () => []);
    const recent = draws.slice(-20);
    const seenSums = new Set(), seenPairs = new Set();
    const oSums = {}, oPairs = {};

    draws.forEach(combo => {
      const sum = getSum(combo);
      sumMap[sum] = (sumMap[sum] || 0) + 1;

      getPairs(combo).forEach(pair => {
        pairMap[pair] = (pairMap[pair] || 0) + 1;
      });

      combo.forEach((d, i) => {
        posMap[i][d] = (posMap[i][d] || 0) + 1;
      });
    });

    recent.forEach(combo => {
      seenSums.add(getSum(combo));
      getPairs(combo).forEach(pair => seenPairs.add(pair));
    });

    for (let s in sumMap) if (!seenSums.has(+s)) oSums[s] = sumMap[s];
    for (let p in pairMap) if (!seenPairs.has(p)) oPairs[p] = pairMap[p];

    setSumFrequencies(sumMap);
    setOverdueSums(Object.keys(oSums).sort((a,b) => oSums[b] - oSums[a]));
    setOverduePairs(Object.keys(oPairs).sort((a,b) => oPairs[b] - oPairs[a]));
    setPositionMap(posMap);
  };

  const generateSmartPicks = (draws, length) => {
    const picks = [];
    const recent = draws.slice(-20);
    const seenSums = new Set(recent.map(combo => getSum(combo)));
    const seenPairs = new Set(recent.flatMap(combo => getPairs(combo)));
    const posMap = positionMap;
    while (picks.length < 10) {
      const combo = Array.from({ length }, () => Math.floor(Math.random() * 10));
      const sum = getSum(combo);
      const pairs = getPairs(combo);
      const hasHotPair = pairs.some(p => !seenPairs.has(p));
      const isOverdueSum = !seenSums.has(sum);
      const strongPos = combo.every((d, i) => (posMap[i]?.[d] || 0) > 1);
      if (hasHotPair || isOverdueSum || strongPos) picks.push(combo.join(""));
    }
    setSmartPicks(picks);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      const draws = parseHistory(text, comboLength);
      setHistory(draws);
      localStorage.setItem("lotteryHistory", JSON.stringify(draws));
      localStorage.setItem("comboLength", comboLength);
      analyzeHistory(draws, comboLength);
    };
    if (file) reader.readAsText(file);
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="p-4 space-y-2">
          <select value={comboLength} onChange={(e) => setComboLength(parseInt(e.target.value))}>
            <option value={3}>Pick 3</option>
            <option value={4}>Pick 4</option>
            <option value={5}>Pick 5</option>
          </select>
          <input type="file" accept=".txt,.csv" onChange={handleFileUpload} />
          <Button onClick={() => generateSmartPicks(history, comboLength)}>Generate Smart Picks</Button>
        </CardContent>
      </Card>

      {smartPicks.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-bold mb-2">Smart Picks</h2>
            <div className="grid grid-cols-2 gap-2">
              {smartPicks.map((num, i) => <div key={i}>{num}</div>)}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold">Overdue Sums</h3>
          <div>{overdueSums.join(", ")}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold">Overdue Pairs</h3>
          <div className="grid grid-cols-4 gap-1 text-sm">{overduePairs.map(p => <div key={p}>{p}</div>)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold">Sum Frequencies</h3>
          <div className="grid grid-cols-5 gap-2 text-sm">
            {Object.entries(sumFrequencies).map(([sum, freq]) => (
              <div key={sum}>{sum}: {freq}</div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold">Digit Heat Map</h3>
          <div className={`grid grid-cols-${comboLength} gap-4 text-sm`}>
            {positionMap.map((pos, i) => (
              <div key={i}>
                <strong>Pos {i + 1}</strong>
                <div className="grid grid-cols-5 gap-1">
                  {pos.map((count, digit) => (
                    <div key={digit}>{digit}: {count || 0}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LotteryAnalyzerApp;
