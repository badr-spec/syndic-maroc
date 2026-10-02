import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// API route handlers
import confirmPaymentHandler from './api/confirm-payment.js';
import deleteSyndicHandler from './api/delete-syndic.js';
import inviteResidentHandler from './api/invite-resident.js';
import inviteSyndicHandler from './api/invite-syndic.js';
import inviteUserHandler from './api/invite-user.js';
import listSyndicsHandler from './api/list-syndics.js';
import notifyVirementHandler from './api/notify-virement.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API routes
app.all('/api/confirm-payment', (req, res) => confirmPaymentHandler(req, res));
app.all('/api/delete-syndic', (req, res) => deleteSyndicHandler(req, res));
app.all('/api/invite-resident', (req, res) => inviteResidentHandler(req, res));
app.all('/api/invite-syndic', (req, res) => inviteSyndicHandler(req, res));
app.all('/api/invite-user', (req, res) => inviteUserHandler(req, res));
app.all('/api/list-syndics', (req, res) => listSyndicsHandler(req, res));
app.all('/api/notify-virement', (req, res) => notifyVirementHandler(req, res));

// Payment declare routes (used by PaymentVirementModal)
app.post(['/api/declare-payment', '/api/payments/declare'], (req, res) => {
  res.json({ success: true, message: 'Paiement déclaré avec succès' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true, host: '0.0.0.0', port: Number(PORT) },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
