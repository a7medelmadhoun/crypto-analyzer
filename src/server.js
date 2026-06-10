const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'Crypto Analyzer API',
    version: '1.0.0',
    endpoints: {
      analyze: 'POST /api/analyze',
      technical: 'POST /api/technical',
      symbols: 'GET /api/symbols',
      health: 'GET /api/health'
    }
  });
});

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
