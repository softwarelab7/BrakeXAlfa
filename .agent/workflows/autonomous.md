---
description: Autonomous Behavior Mode
---
// turbo-all
1. When the user asks for a task, research the current state of the codebase first.
2. Implement the changes directly without asking for permission for every small step.
3. Use the `SafeToAutoRun` property in the `run_command` tool to execute non-destructive commands immediately.
4. Verify the changes using the `browser_subagent` and screenshots before reporting back.
5. Provide a summary of all actions taken and the final result.
6. Only ask for clarification if the user's objective is fundamentally ambiguous or requires a choice between major architectural paths.
