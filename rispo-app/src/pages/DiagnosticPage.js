import React, { useState } from 'react';
import authService from '../services/authService';
import axios from '../services/axiosConfig';

const DiagnosticPage = () => {
    const [results, setResults] = useState([]);

    const addResult = (test, status, details) => {
        setResults(prev => [...prev, { test, status, details, timestamp: new Date().toISOString() }]);
    };

    const runDiagnostics = async () => {
        setResults([]);
        
        // Test 1: Environment Variables
        addResult('Environment Check', 'info', {
            NODE_ENV: process.env.NODE_ENV,
            REACT_APP_API_URL: process.env.REACT_APP_API_URL,
            userAgent: navigator.userAgent,
            location: window.location.href
        });

        // Test 2: LocalStorage functionality
        try {
            localStorage.setItem('test', 'testvalue');
            const testValue = localStorage.getItem('test');
            localStorage.removeItem('test');
            addResult('LocalStorage Test', testValue === 'testvalue' ? 'success' : 'error', {
                canWrite: true,
                canRead: testValue === 'testvalue',
                value: testValue
            });
        } catch (err) {
            addResult('LocalStorage Test', 'error', {
                error: err.message,
                canAccess: false
            });
        }

        // Test 3: User Storage
        const userStr = localStorage.getItem('user');
        let user = null;
        try {
            user = userStr ? JSON.parse(userStr) : null;
            addResult('User Storage', user ? 'success' : 'error', {
                hasUserData: !!userStr,
                canParse: !!user,
                hasToken: !!user?.token,
                username: user?.username,
                role: user?.role,
                tokenPreview: user?.token ? user.token.substring(0, 20) + '...' : 'MISSING'
            });
        } catch (err) {
            addResult('User Storage', 'error', {
                hasUserData: !!userStr,
                parseError: err.message,
                rawData: userStr?.substring(0, 100)
            });
        }

        // Test 3: API Base URL
        const API_URL = process.env.REACT_APP_API_URL || '/api';
        addResult('API Configuration', 'info', { API_URL });

        // Test 4: Simple GET request
        try {
            const response = await axios.get(`${API_URL}/tournaments/published`);
            addResult('GET /tournaments/published', 'success', {
                status: response.status,
                dataCount: response.data?.length,
                hasData: !!response.data
            });
        } catch (err) {
            addResult('GET /tournaments/published', 'error', {
                message: err.message,
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
                url: err.config?.url,
                headers: err.config?.headers
            });
        }

        // Test 5: Check if auth header is added
        try {
            const testAxios = axios.create();
            const interceptorId = testAxios.interceptors.request.use(config => {
                addResult('Request Interceptor', 'info', {
                    url: config.url,
                    hasAuthHeader: !!config.headers?.Authorization,
                    authHeader: config.headers?.Authorization ? 'Bearer ***' : 'MISSING'
                });
                return config;
            });
            
            await testAxios.get(`${API_URL}/tournaments/published`);
            testAxios.interceptors.request.eject(interceptorId);
        } catch (err) {
            // Expected to fail, we just wanted to see the headers
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>Rispo Diagnostics</h1>
            <button 
                onClick={runDiagnostics}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: '20px'
                }}
            >
                Run Diagnostics
            </button>

            <div>
                {results.map((result, index) => (
                    <div 
                        key={index}
                        style={{
                            marginBottom: '15px',
                            padding: '10px',
                            backgroundColor: 
                                result.status === 'success' ? '#d4edda' :
                                result.status === 'error' ? '#f8d7da' :
                                '#d1ecf1',
                            border: '1px solid ' + (
                                result.status === 'success' ? '#c3e6cb' :
                                result.status === 'error' ? '#f5c6cb' :
                                '#bee5eb'
                            ),
                            borderRadius: '4px'
                        }}
                    >
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                            [{result.status.toUpperCase()}] {result.test}
                        </div>
                        <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(result.details, null, 2)}
                        </pre>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DiagnosticPage;
