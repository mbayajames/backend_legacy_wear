import { Router } from 'express';
import paymentController from '../controllers/paymentController';

const router = Router();

router.post('/stk-push', paymentController.initiateMpesaPayment);
router.post('/callback', paymentController.handleMpesaCallback);

export default router;