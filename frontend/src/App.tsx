import React, { useState } from "react";
import axios from "axios";
import {
  Button,
  TextField,
  Container,
  Typography,
  Paper,
  LinearProgress,
} from "@mui/material";
import ArticleList from "./components/ArticleList";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Create a light theme
const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: "Arial, sans-serif",
  },
});

function App() {
  const [topic, setTopic] = useState("machine learning");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState('India');
  const [maxResults, setMaxResults] = useState(10);
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  const handleSearch = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/search', { 
        topic,
        country,
        maxResults,
        startYear,
        endYear
      }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    setResults(response.data);
  } catch (error) {
    if (typeof error === "object" && error !== null && "response" in error) {
      // @ts-ignore
      console.error("Server Error:", (error as any).response.data);
    } else if (typeof error === "object" && error !== null && "message" in error) {
      // @ts-ignore
      console.error("Network Error:", (error as any).message);
    } else {
      console.error("An unknown error occurred:", error);
    }
  }
};

  // const handleSearch = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await axios.post('http://localhost:5000/api/search', { 
  //       topic,
  //       country,
  //       maxResults,
  //       startYear,
  //       endYear
  //     });
  //     setResults(response.data);
  //   } catch (error) {
  //     console.error('Error:', error);
  //   }
  //   setLoading(false);
  // };

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth="md"
        style={{
          padding: "2rem",
          minHeight: "100vh",
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Typography variant="h4" gutterBottom>
          India PubMed Summarizer
        </Typography>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        <TextField
          label="Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          fullWidth
        />
        
        <TextField
          label="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          select
          SelectProps={{ native: true }}
        >
          <option value="India">India</option>
          <option value="China">China</option>
          <option value="USA">USA</option>
        </TextField>

        <TextField
          label="Max Results"
          type="number"
          value={maxResults}
          onChange={(e) => setMaxResults(Math.min(100, parseInt(e.target.value) || 10))}
          inputProps={{ min: 1, max: 100 }}
        />

        <TextField
          label="Start Year"
          type="number"
          value={startYear}
          onChange={(e) => setStartYear(e.target.value)}
          inputProps={{ min: 1900, max: new Date().getFullYear() }}
        />

        <TextField
          label="End Year"
          type="number"
          value={endYear}
          onChange={(e) => setEndYear(e.target.value)}
          inputProps={{ min: 1900, max: new Date().getFullYear() }}
        />
      </div>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          disabled={loading}
          style={{ marginBottom: "2rem" }}
        >
          Search
        </Button>

        {loading && <LinearProgress style={{ marginBottom: "1rem" }} />}

        <ArticleList articles={results} />
      </Container>
    </ThemeProvider>
  );
}

export default App;
