# kelee-AI-rule

Convert Kelee Loon AI rules to a Clash/Mihomo classical rule-provider.

## Rule URL

```text
https://raw.githubusercontent.com/imzwr214/kelee-AI-rule/main/rules/Clash/AI.yaml
```

## FlClash usage

```yaml
rule-providers:
  AI_Kelee:
    type: http
    behavior: classical
    url: https://raw.githubusercontent.com/imzwr214/kelee-AI-rule/main/rules/Clash/AI.yaml
    path: ./ruleset/custom/AI_Kelee.yaml
    interval: 86400

rules:
  - RULE-SET,AI_Kelee,🤖 AI 专属
```

## Update locally

```bash
npm run convert
```

The GitHub Actions workflow updates the generated rule file every day.
