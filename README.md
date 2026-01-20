# Marlowe - AI Investigator for Financial Crime

Marlowe is an AI-powered investigative analysis platform that helps compliance professionals and investigators analyze evidence, screen entities against sanctions lists, and uncover financial crime patterns.

## Features

- **Scout Mode**: Real-time sanctions screening against OFAC, EU, UK, and other global lists
- **Cipher Mode**: Deep analysis of documents, emails, and financial records for fraud detection
- **Entity Network Visualization**: Interactive graphs showing ownership structures and relationships
- **AI-Powered Analysis**: Uses Claude AI to identify red flags, typologies, and investigative leads

## Demo

Try the live demo: [Your Vercel URL here]

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/marlowe-app.git
cd marlowe-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your Anthropic API key to `.env`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

5. Start the development server:
```bash
npm start
```

## Deployment to Vercel

1. Push this repository to GitHub

2. Import the project in Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository

3. Configure environment variables in Vercel:
   - Go to Project Settings > Environment Variables
   - Add `ANTHROPIC_API_KEY` with your API key

4. Deploy!

## Tech Stack

- React 18
- Tailwind CSS
- Claude AI (Anthropic API)
- Vercel Serverless Functions
- react-force-graph-2d for network visualization

## License

MIT
