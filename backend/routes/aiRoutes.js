const express = require('express');
const router = express.Router();
const {
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
    codeIntegration,
    chatWithAI
} = require('../controller/aiControllers');


// Middleware to handle AI requests
router.post('/suggestion', codeSuggestion);
router.post('/completion', codeCompletion);
router.post('/refactoring', codeRefactoring);
router.post('/debugging', codeDebugging);
router.post('/review', codeReview);
router.post('/generation', codeGeneration);
router.post('/search', codeSearch);
router.post('/documentation', codeDocumentation);       
router.post('/optimization', codeOptimization);
router.post('/analysis', codeAnalysis);
router.post('/integration', codeIntegration);
router.post('/chat', chatWithAI);

module.exports = router;