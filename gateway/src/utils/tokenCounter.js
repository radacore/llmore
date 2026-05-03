/**
 * Simple token counter estimation.
 * Average: ~4 chars per token for English, ~2 for non-Latin scripts.
 * For production, consider using tiktoken or the actual token count from API response.
 */
function countTokens(text) {
    if (!text || typeof text !== 'string') return 0;
    
    // Simple estimation: split by whitespace and punctuation
    // Then adjust for character count
    const charCount = text.length;
    
    // Check if text is mostly non-Latin (CJK, etc.)
    const nonLatinChars = (text.match(/[^\x00-\x7F]/g) || []).length;
    const nonLatinRatio = nonLatinChars / charCount;
    
    if (nonLatinRatio > 0.5) {
        // Non-Latin heavy text: ~2 chars per token
        return Math.ceil(charCount / 2);
    }
    
    // Mostly Latin: ~4 chars per token
    return Math.ceil(charCount / 4);
}

/**
 * Count tokens from messages array (OpenAI format)
 */
function countMessagesTokens(messages) {
    if (!Array.isArray(messages)) return 0;
    
    let totalTokens = 0;
    for (const msg of messages) {
        // Each message has overhead of ~4 tokens (role, content markers)
        totalTokens += 4;
        if (msg.content) {
            totalTokens += countTokens(msg.content);
        }
        if (msg.role) {
            totalTokens += 1; // role token
        }
    }
    // Every reply is primed with assistant prefix
    totalTokens += 2;
    return totalTokens;
}

module.exports = { countTokens, countMessagesTokens };
