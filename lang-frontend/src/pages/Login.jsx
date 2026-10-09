import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Alert, 
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../components/Toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const validateEmail = (value) => {
    if (!value.trim()) {
      setEmailError("Email бос болмауы керек");
      return false;
    }
    if (!value.includes("@")) {
      setEmailError("Email мекенжайы дұрыс емес");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Email мекенжайының форматы дұрыс емес");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError("Құпия сөз бос болмауы керек");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateForm = () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    return isEmailValid && isPasswordValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Клиентская валидация перед отправкой
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // use context login so AuthProvider updates user/loading
      const data = await login(email, password);

      toast.success(`Қош келдіңіз, ${data.user?.name || "пайдаланушы"}!`);

      // redirect to original page or home
      const to = location.state?.from?.pathname || "/home";
      setTimeout(() => navigate(to, { replace: true }), 300);
    } catch (err) {
      const errorMessage = err.message || "Сервер қатесі. Кейінірек көріңіз.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Кіру қатесі:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-800 via-purple-700 to-purple-800 p-4 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '450px' }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(88, 28, 135, 0.7) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            p: 4,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Typography
              variant="h3"
              component="h1"
              sx={{
                textAlign: 'center',
                mb: 4,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Adenly-ға кіру
            </Typography>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            </motion.div>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TextField
                fullWidth
                type="email"
                label="Email"
                placeholder="Email енгізіңіз"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(email)}
                error={!!emailError}
                helperText={emailError}
                required
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#a78bfa' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(10px)',
                    color: '#f1f5f9',
                    borderRadius: '12px',
                    '& fieldset': {
                      borderColor: 'rgba(139, 92, 246, 0.4)',
                      borderWidth: '2px',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(30, 41, 59, 0.8)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(139, 92, 246, 0.6)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b5cf6',
                      borderWidth: '2px',
                    },
                    '&.Mui-error fieldset': {
                      borderColor: '#ef4444',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#cbd5e1',
                    fontWeight: 500,
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#a78bfa',
                  },
                  '& .MuiInputBase-input': {
                    color: '#f1f5f9',
                    fontWeight: 500,
                    '&::placeholder': {
                      color: '#94a3b8',
                      opacity: 1,
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#fca5a5',
                    fontSize: '0.875rem',
                  },
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                label="Құпия сөз"
                placeholder="Құпия сөзді енгізіңіз"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                }}
                onBlur={() => validatePassword(password)}
                error={!!passwordError}
                helperText={passwordError}
                required
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#a78bfa' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ 
                          color: '#a78bfa',
                          '&:hover': {
                            backgroundColor: 'rgba(167, 139, 250, 0.2)',
                          },
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(10px)',
                    color: '#f1f5f9',
                    borderRadius: '12px',
                    '& fieldset': {
                      borderColor: 'rgba(139, 92, 246, 0.4)',
                      borderWidth: '2px',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(30, 41, 59, 0.8)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(139, 92, 246, 0.6)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b5cf6',
                      borderWidth: '2px',
                    },
                    '&.Mui-error fieldset': {
                      borderColor: '#ef4444',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#cbd5e1',
                    fontWeight: 500,
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#a78bfa',
                  },
                  '& .MuiInputBase-input': {
                    color: '#f1f5f9',
                    fontWeight: 500,
                    '&::placeholder': {
                      color: '#94a3b8',
                      opacity: 1,
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#fca5a5',
                    fontSize: '0.875rem',
                  },
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                size="large"
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 500,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Кіру'}
              </Button>
            </motion.div>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Link
              to="/forgot-password"
              style={{
                fontSize: '0.875rem',
                color: '#8b5cf6',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.color = '#a78bfa'}
              onMouseLeave={(e) => e.target.style.color = '#8b5cf6'}
            >
              Құпия сөзді ұмыттыңыз ба?
            </Link>
            <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
              Есептік жазба жоқ па?{' '}
              <Link
                to="/register"
                style={{
                  color: '#8b5cf6',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.color = '#a78bfa'}
                onMouseLeave={(e) => e.target.style.color = '#8b5cf6'}
              >
                Тіркелу
              </Link>
            </Typography>
          </Box>
        </Box>
      </motion.div>
    </div>
  );
}
