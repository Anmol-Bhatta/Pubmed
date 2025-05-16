import React from 'react';
import { Paper, Typography, Link, Divider } from '@mui/material';

export default function ArticleList({ articles }) {
  return (
    <div>
      {articles.map((article) => (
        <Paper 
          key={article.pmid} 
          elevation={2}
          sx={{ 
            padding: 3,
            marginBottom: 2,
            borderRadius: 2,
            backgroundColor: 'background.paper'
          }}
        >
          <Typography variant="h6" gutterBottom color="text.primary">
            {article.title}
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            {article.summary}
          </Typography>
          <Link
            href={`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}`}
            target="_blank"
            rel="noopener"
            color="primary"
          >
            View on PubMed
          </Link>
          <Divider sx={{ my: 2 }} />
        </Paper>
      ))}
    </div>
  );
}