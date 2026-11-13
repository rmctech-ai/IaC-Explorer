window.COURSE = {
 "short": "IaC",
 "key": "iac-explorer-v1",
 "prompt": "$",
 "termTitle": "aws cli",
 "where": "CLI",
 "lab": "cfn",
 "handsOn": "Stack Deployer challenge",
 "errRe": "CREATE_FAILED|ROLLBACK|ValidationError|error occurred|Error:|E[0-9]{4}|FAILED",
 "cats": [
  [
   "all",
   "ALL"
  ],
  [
   "core",
   "BASICS"
  ],
  [
   "cfn",
   "TEMPLATES"
  ],
  [
   "ops",
   "LIFECYCLE"
  ],
  [
   "adv",
   "BUILD & SCALE"
  ],
  [
   "tf",
   "TERRAFORM & CDK"
  ]
 ],
 "catTitle": {
  "core": "IaC BASICS",
  "cfn": "TEMPLATE POWER TOOLS",
  "ops": "LIFECYCLE, SAFETY & SECURITY",
  "adv": "BUILD & SCALE",
  "tf": "BEYOND CLOUDFORMATION"
 },
 "kinds": {
  "cfn": [
   "CLOUDFORMATION",
   "#1d5bd8"
  ],
  "tpl": [
   "TEMPLATE",
   "#7c3aed"
  ],
  "tool": [
   "TOOLING",
   "#0d9488"
  ],
  "err": [
   "FAILURE",
   "#e11d48"
  ]
 },
 "layers": [
  "TEMPLATE",
  "FUNCTIONS",
  "LIFECYCLE",
  "ARCHITECTURE",
  "SCALE & SECURITY",
  "OTHER TOOLS"
 ],
 "levels": [
  [
   0,
   "CLICKOPS RECOVERING"
  ],
  [
   150,
   "YAML WRANGLER"
  ],
  [
   400,
   "TEMPLATE AUTHOR"
  ],
  [
   800,
   "STACK OPERATOR"
  ],
  [
   1300,
   "INFRA BUILDER"
  ],
  [
   2000,
   "PLATFORM ENGINEER"
  ],
  [
   2900,
   "IaC ARCHITECT"
  ]
 ]
};
COURSE.errRe = new RegExp(COURSE.errRe, "i");
