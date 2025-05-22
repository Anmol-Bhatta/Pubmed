import React, { useState, useEffect, memo } from 'react';
import { 
  Paper, 
  Typography, 
  Link, 
  Divider, 
  Box, 
  Chip, 
  IconButton, 
  Collapse, 
  Tooltip, 
  Stack,
  useTheme,
  Fade,
} from '@mui/material';
import { 
  Launch as LaunchIcon, 
  ContentCopy as CopyIcon, 
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  BookmarkBorder as BookmarkIcon,
  Share as ShareIcon,
} from '@mui/icons-material';

interface Article {
  pmid: string;
  title: string;
  abstract: string;
  summary: string;
  year?: number;
  country?: string;
}

interface ArticleListProps {
  articles: Article[];
}

// Use memo to prevent unnecessary re-renders when other state changes
const ArticleItem = memo(({ article, expandedId, setExpandedId, copiedId, setCopiedId, savedArticles, handleSaveClick, handleShareClick }: {
  article: Article;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  copiedId: string | null;
  setCopiedId: (id: string | null) => void;
  savedArticles: string[];
  handleSaveClick: (pmid: string) => void;
  handleShareClick: (article: Article) => void;
}) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  
  // Add entry animation when article is added
  useEffect(() => {
    // Small delay to stagger animations
    const timer = setTimeout(() => {
      setVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleExpandClick = (pmid: string) => {
    setExpandedId(expandedId === pmid ? null : pmid);
  };

  const handleCopyClick = async (text: string, pmid: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(pmid);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <Fade in={visible} timeout={500}>
      <Paper 
        elevation={2}
        sx={{ 
          p: 0,
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.palette.mode === 'light' 
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            color="text.primary"
            sx={{ 
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {article.title}
          </Typography>
          
          <Stack 
            direction="row" 
            spacing={1} 
            sx={{ mb: 2 }}
            flexWrap="wrap"
            gap={1}
          >
            {article.year && (
              <Chip 
                label={`Year: ${article.year}`} 
                size="small" 
                color="primary"
                variant="outlined"
                sx={{ borderRadius: '6px' }}
              />
            )}
            {article.country && (
              <Chip 
                label={`Country: ${article.country}`} 
                size="small" 
                color="secondary"
                variant="outlined"
                sx={{ borderRadius: '6px' }}
              />
            )}
            <Chip 
              label={`PMID: ${article.pmid}`} 
              size="small"
              variant="outlined" 
              sx={{ borderRadius: '6px' }}
            />
          </Stack>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              mb: 2, 
              lineHeight: 1.6,
              fontSize: '0.95rem',
              '& b, & strong': {
                color: theme.palette.mode === 'light' ? 'primary.main' : 'primary.light',
                fontWeight: 600,
              }
            }}
          >
            {article.summary}
          </Typography>
          
          <Collapse in={expandedId === article.pmid} timeout="auto" unmountOnExit>
            <Box 
              sx={{ 
                mt: 2, 
                p: 2, 
                borderRadius: 2, 
                bgcolor: theme.palette.mode === 'light' ? 'rgba(245, 248, 255, 0.8)' : 'rgba(30, 41, 59, 0.3)',
              }}
            >
              <Typography 
                variant="subtitle2" 
                gutterBottom
                sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary',
                  mb: 1 
                }}
              >
                Abstract
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ lineHeight: 1.6 }}
              >
                {article.abstract}
              </Typography>
            </Box>
          </Collapse>
        </Box>
        
        <Divider />
        
        <Stack 
          direction="row" 
          spacing={1} 
          sx={{ 
            px: 2,
            py: 1.5,
            justifyContent: 'space-between'
          }}
        >
          <Stack direction="row" spacing={1}>
            <Tooltip title="View on PubMed">
              <IconButton 
                size="small"
                component={Link}
                href={`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}`}
                target="_blank"
                rel="noopener"
                color="primary"
              >
                <LaunchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={copiedId === article.pmid ? "Copied!" : "Copy Summary"}>
              <IconButton 
                size="small"
                onClick={() => handleCopyClick(
                  `${article.title}\n\n${article.summary}\n\nView on PubMed: https://pubmed.ncbi.nlm.nih.gov/${article.pmid}`,
                  article.pmid
                )}
                color={copiedId === article.pmid ? "success" : "default"}
              >
                {copiedId === article.pmid ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Save Article">
              <IconButton 
                size="small"
                onClick={() => handleSaveClick(article.pmid)}
                color={savedArticles.includes(article.pmid) ? "primary" : "default"}
              >
                <BookmarkIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Share">
              <IconButton 
                size="small"
                onClick={() => handleShareClick(article)}
              >
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={expandedId === article.pmid ? "Hide Abstract" : "Show Abstract"}>
              <IconButton 
                size="small"
                onClick={() => handleExpandClick(article.pmid)}
                sx={{
                  transform: expandedId === article.pmid ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                }}
              >
                <ExpandMoreIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>
    </Fade>
  );
});

export default function ArticleList({ articles }: ArticleListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedArticles, setSavedArticles] = useState<string[]>([]);

  const handleSaveClick = (pmid: string) => {
    setSavedArticles(prev => 
      prev.includes(pmid) 
        ? prev.filter(id => id !== pmid) 
        : [...prev, pmid]
    );
  };

  const handleShareClick = async (article: Article) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}`
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // If Web Share API is not available, copy to clipboard
      try {
        await navigator.clipboard.writeText(
          `${article.title}\n\n${article.summary}\n\nView on PubMed: https://pubmed.ncbi.nlm.nih.gov/${article.pmid}`
        );
        setCopiedId(article.pmid);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  return (
    <Stack spacing={3}>
      {articles.map((article) => (
        <ArticleItem 
          key={article.pmid}
          article={article}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          copiedId={copiedId}
          setCopiedId={setCopiedId}
          savedArticles={savedArticles}
          handleSaveClick={handleSaveClick}
          handleShareClick={handleShareClick}
        />
      ))}
    </Stack>
  );
}