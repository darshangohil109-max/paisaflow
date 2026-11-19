import { Router } from 'express';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import {
  generateFinancialAssistantReply,
  type ChatHistoryMessage,
  type FinancialContextPayload,
} from '../services/geminiService';

export const aiRouter = Router();

aiRouter.post(
  '/chat',
  asyncHandler(async (req, res) => {
    const body = req.body as {
      question?: unknown;
      history?: ChatHistoryMessage[];
      financialContext?: FinancialContextPayload;
    };

    if (typeof body?.question !== 'string' || !body.question.trim()) {
      throw new AppError('Please enter a valid question.', 400, 'INVALID_QUESTION');
    }

    const reply = await generateFinancialAssistantReply({
      question: body.question,
      history: body.history,
      financialContext: body.financialContext,
    });

    res.json({ reply });
  })
);
