import dotenv from 'dotenv';
dotenv.config();

import { app } from './infrastructure/server';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`Fuel EU Maritime API listening on http://localhost:${PORT}`);
});
