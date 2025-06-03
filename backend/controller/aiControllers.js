const asyncHandler = require('express-async-handler');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const createSystemPrompt = (task, language, context) => {
    const prompts = {
        codeSuggestion: `You are an AI assistant specialized in providing code suggestions. Task: ${task}. Language: ${language}. Context: ${context}`,
        codeCompletion: `You are an AI assistant specialized in completing code snippets. Task: ${task}. Language: ${language}. Context: ${context}`,
        codeRefactoring: `You are an AI assistant specialized in refactoring code. Task: ${task}. Language: ${language}. Context: ${context}`,
        codeDebugging: `You are an AI assistant specialized in debugging code. Task: ${task}. Language: ${language}. Context: ${context}`,
        codeReview: `You are an AI assistant specialized in reviewing code. Task: ${task}. Language: ${language}. Context: ${context}`,
        codeGeneration: `You are an AI assistant specialized in generating code. Task: ${task}. Language: ${language}. Context: ${context}`,
        codeSearch: `You are an AI assistant specialized in searching for code snippets. Task: ${task}. Language: ${language}. Context: ${context}`,
        codeDocumentation: `You are an AI assistant specialized in generating documentation for code. Task: ${task}. Language: ${language}. Context: ${context}`,
        codeOptimization: `You are an AI assistant specialized in optimizing code. Task: ${task}. Language: ${language}. Context: ${context}`,
        codeAnalysis: `You are an AI assistant specialized in analyzing code. Task: ${task}. Language: ${language}. Context: ${context}`,
        codeIntegration: `You are an AI assistant specialized in integrating code. Task: ${task}. Language: ${language}. Context: ${context}`,
        chatWithAI: `You are an AI assistant that can chat with users about various topics, including programming and technology. Task: ${task}. Language: ${language}. Context: ${context}`
    };
    return prompts[task] || `You are an AI assistant. Task: ${task}. Language: ${language}. Context: ${context}`;
};

const callOpenAI = async (systemPrompt, userPrompt, model = 'gpt-4') => {
    try {
        const response = await openai.createChatCompletion({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 1500,
            temperature: 0.7,
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        throw new Error('Failed to get response from OpenAI');
    }
};

const codeSuggestion = asyncHandler(async (req, res) => {
    const { code, language, context } = req.body;
    if (!code || !language || !context) {
        return res.status(400).json({ message: 'Code, language, and context are required.' });
    }

    const systemPrompt = createSystemPrompt('codeSuggestion', language, context);
    const userPrompt = `Suggest improvements or additions to the following code:\n\n${code}`;
    const suggestion = await callOpenAI(systemPrompt, userPrompt);

    res.status(200).json({ suggestion, language, context, timestamp: new Date() });
});

const codeCompletion = asyncHandler(async (req, res) => {
    const { partialCode, language, context } = req.body;
    if (!partialCode || !language || !context) {
        return res.status(400).json({ message: 'Partial code, language, and context are required.' });
    }

    const systemPrompt = createSystemPrompt('codeCompletion', language, context);
    const userPrompt = `Complete the following code snippet:\n\n${partialCode}`;
    const completion = await callOpenAI(systemPrompt, userPrompt);

    res.status(200).json({ completion, originalCode: partialCode, language, context, timestamp: new Date() });
});

const codeRefactoring = asyncHandler(async (req, res) => {
    const { code, language, refactorType } = req.body;
    if (!code || !language) {
        return res.status(400).json({ message: 'Code and language are required.' });
    }

    const systemPrompt = createSystemPrompt('codeRefactoring', language, refactorType || 'general');
    const userPrompt = `Refactor the following code:\n\n${code}`;
    const refactoredCode = await callOpenAI(systemPrompt, userPrompt);

    res.status(200).json({ refactoredCode, originalCode: code, refactorType: refactorType || 'general', language, timestamp: new Date() });
});

const codeDebugging = asyncHandler(async (req, res) => {
    const { code, language, errorMessage } = req.body;
    if (!code || !language || !errorMessage) {
        return res.status(400).json({ message: 'Code, language, and error message are required.' });
    }

    const systemPrompt = createSystemPrompt('codeDebugging', language, errorMessage);
    const userPrompt = `Debug the following code:\n\n${code}\n\nError: ${errorMessage}`;
    const debuggedCode = await callOpenAI(systemPrompt, userPrompt);

    res.status(200).json({ debuggedCode, originalCode: code, language, errorMessage, timestamp: new Date() });
});

const codeReview = asyncHandler(async (req, res) => {
    const { code, language, reviewType } = req.body;
    if (!code || !language) {
        return res.status(400).json({ message: 'Code and language are required.' });
    }

    const systemPrompt = createSystemPrompt('codeReview', language, reviewType || 'general');
    const userPrompt = `Review the following code:\n\n${code}`;
    const review = await callOpenAI(systemPrompt, userPrompt);

    res.status(200).json({ review, originalCode: code, reviewType: reviewType || 'general', language, timestamp: new Date() });
});

const codeGeneration = asyncHandler(async (req, res) => {
    const { prompt, language, framework } = req.body;
    if (!prompt || !language) {
        return res.status(400).json({ message: 'Prompt and language are required.' });
    }

    const systemPrompt = createSystemPrompt('codeGeneration', language, framework || 'vanilla');
    const userPrompt = `Generate code based on the following prompt:\n\n${prompt}`;
    const generatedCode = await callOpenAI(systemPrompt, userPrompt);

    res.status(200).json({ generatedCode, prompt, language, framework: framework || 'vanilla', timestamp: new Date() });
});

const codeSearch = asyncHandler(async (req, res) => {
    const { query, language, context } = req.body;
    if (!query || !language || !context) {
        return res.status(400).json({ message: 'Query, language, and context are required.' });
    }

    const systemPrompt = createSystemPrompt('codeSearch', language, context);
    const userPrompt = `Search for code snippets related to the following query:\n\n${query}`;
    const searchResults = await callOpenAI(systemPrompt, userPrompt);

    res.status(200).json({ searchResults, query, language, context, timestamp: new Date() });
});

const codeDocumentation = asyncHandler(async (req, res) => {
    const { code, language, format, context } = req.body;
    if (!code || !language || !context) {
        return res.status(400).json({ message: 'Code, language, and context are required.' });
    }

    const systemPrompt = createSystemPrompt('codeDocumentation', language, context);
    const userPrompt = `Generate documentation for the following code:\n\n${code}`;
    const documentation = await callOpenAI(systemPrompt, userPrompt);

    res.status(200).json({ documentation, format: format || 'markdown', language, context, timestamp: new Date() });
});

const codeOptimization = asyncHandler(async (req, res) => {
    const { code, language, optimizationType } = req.body;
    if (!code || !language) {
        return res.status(400).json({ message: 'Code and language are required.' });
    }

    const systemPrompt = createSystemPrompt('codeOptimization', language, optimizationType || 'performance');
    const userPrompt = `Optimize the following code:\n\n${code}`;
    const optimizedCode = await callOpenAI(systemPrompt, userPrompt);

    res.status(200).json({ optimizedCode, originalCode: code, optimizationType: optimizationType || 'performance', language, timestamp: new Date() });
});

const codeAnalysis = asyncHandler(async (req, res) => {
    const { code, language, analysisType } = req.body;
    if (!code || !language) {
        return res.status(400).json({ message: 'Code and language are required.' });
    }

    const systemPrompt = createSystemPrompt('codeAnalysis', language, analysisType || 'general');
    const userPrompt = `Analyze the following code:\n\n${code}`;
    const analysis = await callOpenAI(systemPrompt, userPrompt);

    res.status(200).json({ analysis, originalCode: code, analysisType: analysisType || 'general', language, timestamp: new Date() });
});

const codeIntegration = asyncHandler(async (req, res) => {
    const { sourceCode, targetCode, language, integrationType } = req.body;
    if (!sourceCode || !targetCode || !language) {
        return res.status(400).json({ message: 'Source code, target code, and language are required.' });
    }

    const context = integrationType || 'general integration';
    const systemPrompt = createSystemPrompt('codeIntegration', language, context);
    const userPrompt = `Integrate the following source code with the target code:\n\nSource Code:\n${sourceCode}\n\nTarget Code:\n${targetCode}`;
    const integratedCode = await callOpenAI(systemPrompt, userPrompt);

    res.status(200).json({ integratedCode, sourceCode, targetCode, integrationType: context, language, timestamp: new Date() });
});

module.exports = {
    codeSuggestion,
    codeCompletion,
    codeRefactoring,
    codeDebugging,
    codeReview,
    codeGeneration,
    codeSearch,
    codeDocumentation,
    codeOptimization,
    codeAnalysis,
    codeIntegration
};
