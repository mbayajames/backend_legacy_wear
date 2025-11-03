import { Router } from 'express';
import paymentController from '../controllers/paymentController';

const router = Router();

router.post('/mpesa', paymentController.initiateMpesaPayment);
router.post('/card', paymentController.processCardPayment);
router.post('/bank-transfer', paymentController.processBankTransfer);

export default router;