export const metalsRules = [
  {
    condition: (input) => input.meltCountry === "russia",
    result: { code: "9903.85.67", rate: 2.0 }
  },
  {
    condition: (input) => input.metalPercent === 0,
    result: { code: "9903.82.01", rate: 0 }
  },
  {
    condition: (input) => input.metalPercent < 15,
    result: { code: "9903.82.03", rate: 0 }
  }
];
