import mpesaService from '../services/mpesaService';

const initiateMpesaPayment = async (req: any, res: any) => {
  try {
    const { phone, amount, accountReference, transactionDesc } = req.body;
    const result = await mpesaService.initiateSTKPush({ phone, amount, accountReference, transactionDesc });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error initiating M-Pesa payment:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const handleMpesaCallback = async (req: any, res: any) => {
  try {
    await mpesaService.handleCallback(req.body);
    res.status(200).json({ success: true, message: 'Callback handled successfully' });
  } catch (error) {
    console.error('Error handling M-Pesa callback:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const processCardPayment = async (req: any, res: any) => {
  try {
    // TODO: Implement card payment processing logic
    // For now, return a placeholder response
    res.status(200).json({ success: true, message: 'Card payment processed successfully' });
  } catch (error) {
    console.error('Error processing card payment:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const processBankTransfer = async (req: any, res: any) => {
  try {
    // TODO: Implement bank transfer processing logic
    // For now, return a placeholder response
    res.status(200).json({ success: true, message: 'Bank transfer processed successfully' });
  } catch (error) {
    console.error('Error processing bank transfer:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default { initiateMpesaPayment, handleMpesaCallback, processCardPayment, processBankTransfer };