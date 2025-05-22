import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button,
  TextField,
  Container,
  Typography,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Box,
  IconButton,
  Tooltip,
  useMediaQuery,
  Snackbar,
  Alert,
  Skeleton,
  CssBaseline,
  Slider,
  Grid,
  Switch,
} from "@mui/material";
import {
  Search as SearchIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Science as ScienceIcon,
  TuneRounded as TuneIcon,
} from "@mui/icons-material";
import ArticleList from "./components/ArticleList";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Define the Article interface
interface Article {
  pmid: string;
  title: string;
  abstract: string;
  summary: string;
  year?: number;
  country?: string;
}

// New interface for streaming responses
interface StreamResponse {
  status: 'fetching' | 'processing' | 'completed';
  total: number;
  completed: number;
  article?: Article;
}

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(
    localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  );
  const [topic, setTopic] = useState("machine learning");
  const [country, setCountry] = useState("India");
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [maxResults, setMaxResults] = useState<number>(10);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // New state variables for progressive loading
  const [progress, setProgress] = useState({ total: 0, completed: 0 });
  const [progressiveLoading, setProgressiveLoading] = useState(true); // Default to progressive loading

  // Create a responsive theme with dark mode support
  const theme = createTheme({
    palette: {
      mode: mode,
      primary: {
        main: mode === 'light' ? '#2563eb' : '#3b82f6',
      },
      secondary: {
        main: mode === 'light' ? '#d946ef' : '#e879f9',
      },
      background: {
        default: mode === 'light' ? '#f8fafc' : '#0f172a',
        paper: mode === 'light' ? '#ffffff' : '#1e293b',
      },
      text: {
        primary: mode === 'light' ? '#1e293b' : '#f1f5f9',
        secondary: mode === 'light' ? '#475569' : '#94a3b8',
      },
    },
    typography: {
      fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
      h4: {
        fontWeight: 700,
      },
      h6: {
        fontWeight: 600,
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            transition: 'all 0.3s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            boxShadow: 'none',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            },
          },
        },
      },
    },
  });

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('theme', mode);
  }, [mode]);

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const toggleColorMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setProgress({ total: 0, completed: 0 });
    
    // Format dates for PubMed (YYYY/MM/DD)
    const formattedDateRange = {
      start: dateRange.start ? new Date(dateRange.start).toISOString().split('T')[0].replace(/-/g, '/') : null,
      end: dateRange.end ? new Date(dateRange.end).toISOString().split('T')[0].replace(/-/g, '/') : null
    };
    
    // Debug log for date range
    console.log('Date Range:', {
      original: dateRange,
      formatted: formattedDateRange
    });
    
    // Debug log
    console.log('Search payload:', {
      topic,
      country,
      dateRange: formattedDateRange,
      maxResults,
    });
    
    if (progressiveLoading) {
      try {
        // Use fetch for streaming response instead of axios
        const response = await fetch("http://localhost:5000/api/stream-search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            topic,
            country,
            dateRange: formattedDateRange,
            maxResults,
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Create a reader for streaming data
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Failed to get reader from response");
        }
        
        // Process the streamed data
        const decoder = new TextDecoder();
        let partialChunk = "";
        
        // Set search performed early to show the results container
        setSearchPerformed(true);
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = partialChunk + decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          // The last line might be incomplete, save it for the next iteration
          partialChunk = lines.pop() || "";
          
          // Process each line immediately
          for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
              const data: StreamResponse = JSON.parse(line);
              console.log('Received data:', data);  // Debug log
              
              // Force state update to trigger immediate rendering
              setProgress(prev => ({
                total: data.total,
                completed: data.completed
              }));
              
              // If there's an article in the response, add it to results
              if (data.article) {
                console.log('Adding article:', data.article.pmid);  // Debug log
                // Use the function form of setState to ensure we're working with latest state
                setResults(prevResults => {
                  // Create a new array to ensure React detects the change
                  return [...prevResults, data.article!];
                });
              }
            } catch (error) {
              console.error("Error parsing JSON:", error, line);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching articles:", error);
        setError("Failed to fetch articles. Please try again later.");
      } finally {
        setLoading(false);
      }
    } else {
      // Fall back to the original non-streaming approach if progressive loading is disabled
      try {
        const response = await axios.post("http://localhost:5000/api/search", {
          topic,
          country,
          dateRange,
          maxResults,
        });
        console.log('Received non-streaming response:', response.data);  // Debug log
        setResults(response.data);
        setSearchPerformed(true);
      } catch (error) {
        console.error("Error fetching articles:", error);
        setError("Failed to fetch articles. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMaxResultsChange = (_event: Event, newValue: number | number[]) => {
    setMaxResults(newValue as number);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: 'background.default',
          transition: 'background-color 0.3s ease',
          pt: 4,
          pb: 8,
        }}
      >
        <Container maxWidth="md">
          <Box 
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <ScienceIcon
                color="primary"
                sx={{ fontSize: isMobile ? 30 : 36 }}
              />
              <Typography
                variant={isMobile ? "h5" : "h4"}
                component="h1"
                sx={{
                  fontWeight: 700,
                  backgroundImage: 'linear-gradient(45deg, #2563eb, #7e22ce)',
                  backgroundClip: 'text',
                  color: 'transparent',
                  WebkitBackgroundClip: 'text',
                  letterSpacing: '-0.02em',
                }}
              >
                ResearchLens
              </Typography>
            </Stack>
            
            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton onClick={toggleColorMode} aria-label="toggle dark mode" size="large">
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
          </Box>
          
          <Paper 
            elevation={mode === 'light' ? 2 : 3} 
            sx={{
              p: { xs: 2, md: 3 },
              mb: 4,
              borderRadius: 3,
              boxShadow: mode === 'light' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: mode === 'light'
                  ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography 
                variant="h6" 
                component="h2" 
                sx={{ color: 'text.primary' }}
              >
                Search for Research Papers
              </Typography>
              
              <Tooltip title="Advanced options">
                <IconButton 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  color={showAdvanced ? "primary" : "default"}
                  size="small"
                >
                  <TuneIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Search Topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                variant="outlined"
                InputProps={{
                  endAdornment: <SearchIcon color="action" />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2,
                    },
                  },
                }}
              />
              
              {showAdvanced && (
                <>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Country</InputLabel>
                      <Select
                        value={country}
                        onChange={(e) => setCountry(e.target.value as string)}
                        label="Country"
                      >
                        <MenuItem value="India">India</MenuItem>
                        <MenuItem value="United States">United States</MenuItem>
                        <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                        <MenuItem value="China">China</MenuItem>
                        <MenuItem value="Japan">Japan</MenuItem>
                        <MenuItem value="Germany">Germany</MenuItem>
                        <MenuItem value="France">France</MenuItem>
                        <MenuItem value="Canada">Canada</MenuItem>
                        <MenuItem value="Australia">Australia</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Start Date"
                        value={dateRange.start}
                        onChange={(newValue) => {
                          setDateRange({ ...dateRange, start: newValue });
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined"
                          }
                        }}
                      />
                    </LocalizationProvider>
                    
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="End Date"
                        value={dateRange.end}
                        onChange={(newValue) => {
                          setDateRange({ ...dateRange, end: newValue });
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined"
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </Stack>
                  
                  <Box sx={{ mt: 2 }}>
                    <FormControl component="fieldset">
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Loading Mode
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2">Standard</Typography>
                        <Switch
                          checked={progressiveLoading}
                          onChange={(e) => setProgressiveLoading(e.target.checked)}
                          inputProps={{ 'aria-label': 'toggle progressive loading' }}
                          size="small"
                          color="primary"
                        />
                        <Typography variant="body2">Progressive</Typography>
                      </Stack>
                    </FormControl>
                  </Box>
                  
                  <Box sx={{ px: 1 }}>
                    <Typography gutterBottom variant="subtitle2" color="text.secondary">
                      Maximum Results: {maxResults}
                    </Typography>
                    <Slider
                      value={maxResults}
                      onChange={handleMaxResultsChange}
                      aria-labelledby="max-results-slider"
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={5}
                      max={50}
                      sx={{
                        '& .MuiSlider-markLabel': {
                          color: 'text.secondary',
                        },
                      }}
                    />
                  </Box>
                </>
              )}
              
              <Box display="flex" justifyContent="center">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  disabled={loading}
                  size="large"
                  startIcon={<SearchIcon />}
                  sx={{
                    py: 1.2,
                    px: 4,
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #2563eb, #7e22ce)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1d4ed8, #7c3aed)',
                    },
                    fontWeight: 600,
                    transition: 'all 0.3s ease',
                    boxShadow: mode === 'light' 
                      ? '0 4px 6px -1px rgba(37, 99, 235, 0.5), 0 2px 4px -1px rgba(37, 99, 235, 0.3)'
                      : 'none',
                  }}
                >
                  Search
                </Button>
              </Box>
            </Stack>
          </Paper>

          {/* Progress bar for streaming results */}
          {loading && progressiveLoading && progress.total > 0 && (
            <Box sx={{ mt: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Loading articles
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress.completed} of {progress.total}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(progress.completed / progress.total) * 100}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: mode === 'light' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                }}
              />
            </Box>
          )}
          
          {/* Regular loading indicator for non-streaming mode */}
          {loading && (!progressiveLoading || progress.total === 0) && (
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Loading articles...
              </Typography>
              <LinearProgress 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: mode === 'light' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                }}
              />
            </Box>
          )}

          {/* Show already loaded results even during loading */}
          {results.length > 0 && (
            <Box sx={{ my: 2 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 600,
                  color: 'text.secondary'
                }}
              >
                {loading && progressiveLoading ? 'Loading results...' : `Found ${results.length} results`}
              </Typography>
              <ArticleList articles={results} />
            </Box>
          )}

          {/* Show skeletons only if no results yet or if not using progressive loading */}
          {loading && (results.length === 0 || !progressiveLoading) && (
            <Box sx={{ mt: 2, mb: 4 }}>
              {!progressiveLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
              <Stack spacing={2}>
                {[...Array(3)].map((_, index) => (
                  <Paper key={index} sx={{ p: 3, borderRadius: 2 }}>
                    <Skeleton variant="text" width="60%" height={40} animation="wave" />
                    <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1.5 }} animation="wave" />
                    <Skeleton variant="rectangular" height={80} sx={{ mb: 1.5 }} animation="wave" />
                    <Skeleton variant="text" width={120} height={30} animation="wave" />
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {/* Show "no results" message only when not loading and no results found */}
          {!loading && searchPerformed && results.length === 0 && (
            <Paper 
              sx={{ 
                p: 3, 
                my: 4, 
                borderRadius: 2,
                textAlign: 'center',
                backgroundColor: mode === 'light' ? 'rgba(245, 248, 255, 0.8)' : 'rgba(30, 41, 59, 0.8)', 
              }}
            >
              <Typography variant="h6" component="p" gutterBottom>
                No results found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Try modifying your search criteria to find more results.
              </Typography>
            </Paper>
          )}

          
        </Container>
      </Box>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
