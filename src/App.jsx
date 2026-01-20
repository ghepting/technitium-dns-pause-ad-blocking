import React, { useState } from "react";
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Chip,
  Container,
  Card,
  CardContent,
  Typography,
  MenuItem,
  Select,
  Button,
  FormControl,
  InputLabel,
  Box,
  Snackbar,
  Alert,
  GlobalStyles,
} from "@mui/material";
import PauseCircleFilledIcon from "@mui/icons-material/PauseCircleFilled";
import IconButton from "@mui/material/IconButton";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          padding: "10px 20px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        },
      },
    },
  },
});

function App() {
  const [minutes, setMinutes] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resumeTime, setResumeTime] = useState(() => {
    const saved = localStorage.getItem("resumeTime");
    return saved ? new Date(saved) : null;
  });
  const [timeLeft, setTimeLeft] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // 'success' | 'error'
  });

  React.useEffect(() => {
    let interval = null;
    if (resumeTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = resumeTime - now;

        if (diff <= 0) {
          setResumeTime(null);
          localStorage.removeItem("resumeTime");
          setTimeLeft("");
          setSnackbar({
            open: true,
            message: "Ad blocking resumed.",
            severity: "info",
          });
        } else {
          // Format as HH:MM:SS or MM:SS
          const totalSeconds = Math.floor(diff / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const mins = Math.floor((totalSeconds % 3600) / 60);
          const secs = totalSeconds % 60;

          const formatted =
            (hours > 0 ? `${hours}:${mins.toString().padStart(2, "0")}:` : "") +
            `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

          setTimeLeft(formatted);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resumeTime]);

  const [healthStatus, setHealthStatus] = useState(null); // { status: 'ok', updateAvailable: false, ... }

  const checkHealth = React.useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      // data structure: {"response":{"updateAvailable":false,"updateVersion":"14.3","currentVersion":"14.3"},"server":"dns.example.com","status":"ok"}

      if (data.status === "ok" && data.response) {
        setHealthStatus({
          status: "ok",
          updateAvailable: data.response.updateAvailable,
          currentVersion: data.response.currentVersion,
          updateVersion: data.response.updateVersion,
        });
      } else {
        setHealthStatus({ status: "error" });
      }
    } catch (err) {
      setHealthStatus({ status: "error" });
    }
  }, []);

  React.useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [checkHealth]);

  const handleDurationChange = (event) => {
    setMinutes(event.target.value);
  };

  const handlePauseBlocking = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ minutes }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response:", data);

      if (data.success && data.message) {
        try {
          const innerMessage = JSON.parse(data.message);
          if (
            innerMessage.response &&
            innerMessage.response.temporaryDisableBlockingTill
          ) {
            const tillDate = new Date(
              innerMessage.response.temporaryDisableBlockingTill,
            );
            setResumeTime(tillDate);
            localStorage.setItem("resumeTime", tillDate.toISOString());

            // Initial calculation for immediate feedback
            const timeString = tillDate.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            });

            setSnackbar({
              open: true,
              message: `Ad blocking paused until ${timeString}.`,
              severity: "success",
            });
            return;
          }
        } catch (e) {
          console.error("Error parsing inner message", e);
        }
      }

      setSnackbar({
        open: true,
        message: `Ad blocking paused for ${minutes} minutes.`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error pausing blocking:", error);
      setSnackbar({
        open: true,
        message: "Failed to pause ad blocking. Please try again.",
        severity: "error",
      });
      checkHealth(); // Re-check health on failure
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: 0,
          },
          "#root": {
            width: "100%",
          },
        }}
      />
      <Container maxWidth="sm">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <Card sx={{ width: "100%", maxWidth: 400, p: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="center" mb={2}>
                <img
                  src="/ninja.svg"
                  alt="Ninja Logo"
                  style={{ width: "85%" }}
                />
              </Box>
              <Typography
                variant="h6"
                component="h1"
                gutterBottom
                align="center"
                sx={{ mb: 10, fontWeight: "bold" }}
              >
                Pause Ninja Ad Blocking
              </Typography>

              <Box display="flex" justifyContent="center" mt={10}>
                <IconButton
                  color="primary"
                  onClick={handlePauseBlocking}
                  disabled={
                    loading ||
                    !!resumeTime ||
                    (healthStatus && healthStatus.status !== "ok")
                  }
                  size="large"
                  sx={{
                    transform: "scale(4)",
                    padding: 1,
                  }}
                  aria-label="pause ad blocking"
                >
                  <PauseCircleFilledIcon fontSize="large" />
                </IconButton>
              </Box>
              <Typography
                variant="caption"
                display="block"
                align="center"
                sx={{ mt: 5, opacity: 0.7 }}
              >
                {loading
                  ? "Pausing..."
                  : healthStatus && healthStatus.status !== "ok"
                    ? "Server Unhealthy"
                    : resumeTime
                      ? `Resuming in ${timeLeft}`
                      : "Tap to Pause"}
              </Typography>

              <FormControl fullWidth sx={{ mt: 5 }}>
                <InputLabel id="duration-select-label">Duration</InputLabel>
                <Select
                  labelId="duration-select-label"
                  id="duration-select"
                  value={minutes}
                  label="Duration"
                  onChange={handleDurationChange}
                >
                  <MenuItem value={1}>1 Minute</MenuItem>
                  <MenuItem value={5}>5 Minutes</MenuItem>
                  <MenuItem value={15}>15 Minutes</MenuItem>
                  <MenuItem value={30}>30 Minutes</MenuItem>
                  <MenuItem value={60}>1 Hour</MenuItem>
                  <MenuItem value={120}>2 Hours</MenuItem>
                  <MenuItem value={240}>4 Hours</MenuItem>
                  <MenuItem value={480}>8 Hours</MenuItem>
                  <MenuItem value={1440}>24 Hours</MenuItem>
                </Select>
              </FormControl>

              {healthStatus && (
                <Box mt={4} textAlign="center">
                  <Box>
                    <Typography
                      variant="body2"
                      color={
                        healthStatus.status === "ok" ? "textSecondary" : "error"
                      }
                      mb={1}
                    >
                      Ninja DNS Server Status:
                    </Typography>
                    <Chip
                      label={healthStatus.status === "ok" ? "Up" : "Down"}
                      color={healthStatus.status === "ok" ? "success" : "error"}
                    />
                  </Box>
                  {healthStatus.updateAvailable && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Update Available: {healthStatus.updateVersion} (Current:{" "}
                      {healthStatus.currentVersion})
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
