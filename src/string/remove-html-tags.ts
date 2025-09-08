export function removeHtmlTags(input: string): string {
  // Input validation
  if (!input || typeof input !== "string") {
    return ""
  }

  // Apply reasonable input length limit for safety
  const maxLength = 100000 // Adjust based on your requirements
  let updatedInput = input
  if (updatedInput.length > maxLength) {
    updatedInput = updatedInput.slice(0, maxLength)
  }

  // Use a non-backtracking approach to prevent ReDoS vulnerabilities
  return updatedInput.replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, "")
}
