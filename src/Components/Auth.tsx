// Auth.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Input, Button, Form, Typography, Layout, message, Row, Col, InputRef } from 'antd';
import { backend_url } from '../constants';
import { signIn } from '../UserReducer';
import FadeInContainer from './FadeInContainer';
import './Auth.css';

const { Title } = Typography;
const { Header, Footer, Content } = Layout;

const Auth = () => {
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const otpInputRefs = useRef<(InputRef | null)[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const validateInputs = (): boolean => {
    if (!username || otp.some((digit) => !digit)) {
      message.error('Invalid details: Username and OTP cannot be empty');
      return false;
    }
    return true;
  };

  const login = async () => {
    if (!validateInputs()) return;

    const response = await fetch(`${backend_url}/verifyOtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${username}&otp=${otp.join('')}`,
    }).then((data) => data.json());

    if (response.message === 'Logged in') {
      dispatch(signIn({ email: username, userData: response.user_data }));
      navigate('/chat');
    } else {
      message.error('Login failed');
    }
  };

  const sendOTP = async () => {
    const response = await fetch(`${backend_url}/sendOtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${username}`,
    }).then((data) => data.json());

    if (response.message === 'Mail sent successfully') {
      message.success('OTP sent successfully');
      setIsOtpSent(true);
      setCountdown(30);

      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(intervalRef.current!);
            setIsOtpSent(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      message.error('OTP sending failed');
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < otpInputRefs.current.length - 1) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <Layout className="auth-layout">
      <Header className="navbar" style={{ backgroundColor: 'white' }}>
        <Title level={3} style={{ textDecoration: 'underline' }}>Chat Application</Title>
      </Header>

      <Content className="auth-content">
        <FadeInContainer>
          <div className="form-container">
            <Title level={3}>Login</Title>
            <Form layout="vertical">
              <Form.Item label="Email">
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your email"
                />
              </Form.Item>

              <Button
                type="primary"
                onClick={() => {
                  if (username && username.includes('@')) {
                    sendOTP();
                  } else {
                    message.warning('Please enter a valid email');
                  }
                }}
                style={{ marginBottom: '16px' }}
                disabled={isOtpSent}
              >
                {isOtpSent ? `Resend OTP in ${countdown}s` : 'Send OTP'}
              </Button>

              {isOtpSent && (
                <Form.Item label="OTP">
                  <Row gutter={8}>
                    {otp.map((digit, index) => (
                      <Col span={4} key={index}>
                        <Input
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          style={{ textAlign: 'center' }}
                        />
                      </Col>
                    ))}
                  </Row>
                </Form.Item>
              )}

              <Button type="primary" onClick={login} block>
                Login
              </Button>
            </Form>
          </div>
        </FadeInContainer>
      </Content>

      <Footer style={{ textAlign: 'center', backgroundColor: 'white' }}>
        &copy; {new Date().getFullYear()} Chat Application. All rights reserved.
      </Footer>
    </Layout>
  );
};

export default Auth;
