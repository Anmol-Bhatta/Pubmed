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

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/search", {
        topic,
      });
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
    setLoading(false);
  };

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

        <TextField
          fullWidth
          label="Search Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          variant="outlined"
          margin="normal"
        />

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
