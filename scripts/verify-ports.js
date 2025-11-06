#!/usr/bin/env node

/**
 * Port Verification Script
 * Checks if the required ports are available and services are running
 */

import { exec } from 'child_process';
import net from 'net';
import { promisify } from 'util';
import http from 'http';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Port configurations for different scenarios
const SCENARIOS = {
  'local-local': {
    name: 'Local Frontend + Local Backend',
    frontend: { port: 5173, type: 'local' },
    backend: { port: 3000, type: 'local' }
  },
  'docker-docker': {
    name: 'Docker Frontend + Docker Backend',
    frontend: { port: 8080, type: 'docker' },
    backend: { port: 8000, type: 'docker' }
  },
  'local-docker': {
    name: 'Local Frontend + Docker Backend',
    frontend: { port: 5173, type: 'local' },
    backend: { port: 8000, type: 'docker' }
  },
  'docker-local': {
    name: 'Docker Frontend + Local Backend',
    frontend: { port: 8080, type: 'docker' },
    backend: { port: 3000, type: 'local' }
  }
};

/**
 * Check if a port is available (not in use)
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

/**
 * Check if a service is responding on a port
 */
function isServiceRunning(port, path = '') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode < 400);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.setTimeout(2000);
    req.end();
  });
}

/**
 * Get processes using specific ports (Windows)
 */
async function getPortUsage(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    return stdout.trim();
  } catch (error) {
    return 'Not in use';
  }
}

/**
 * Check environment configuration
 */
function checkEnvConfig() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    return {
      exists: false,
      message: 'No .env file found. Copy from config-templates/'
    };
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const apiUrlMatch = envContent.match(/VITE_API_BASE_URL=(.+)/);
  
  if (!apiUrlMatch) {
    return {
      exists: true,
      apiUrl: null,
      message: 'VITE_API_BASE_URL not found in .env'
    };
  }

  return {
    exists: true,
    apiUrl: apiUrlMatch[1].trim(),
    message: 'Configuration found'
  };
}

/**
 * Main verification function
 */
async function verifyConfiguration() {
  console.log('🔍 Port Configuration Verification\n');

  // Check environment configuration
  console.log('📋 Environment Configuration:');
  const envConfig = checkEnvConfig();
  console.log(`   .env file: ${envConfig.exists ? '✅ Found' : '❌ Missing'}`);
  console.log(`   API URL: ${envConfig.apiUrl || 'Not configured'}`);
  console.log(`   Status: ${envConfig.message}\n`);

  // Check port availability
  console.log('🔌 Port Availability:');
  const ports = [3000, 5173, 8000, 8080];
  
  for (const port of ports) {
    const available = await isPortAvailable(port);
    const usage = await getPortUsage(port);
    const running = await isServiceRunning(port);
    
    console.log(`   Port ${port}:`);
    console.log(`     Available: ${available ? '✅ Yes' : '❌ No'}`);
    console.log(`     Service Running: ${running ? '✅ Yes' : '⭕ No'}`);
    if (!available) {
      console.log(`     Usage: ${usage.split('\\n')[0] || 'Unknown process'}`);
    }
    console.log('');
  }

  // Check service health
  console.log('🏥 Service Health Checks:');
  
  // Backend health checks
  const backendLocal = await isServiceRunning(3000, '/api/v1/health');
  const backendDocker = await isServiceRunning(8000, '/api/v1/health');
  
  console.log(`   Backend Local (3000): ${backendLocal ? '✅ Healthy' : '❌ Not responding'}`);
  console.log(`   Backend Docker (8000): ${backendDocker ? '✅ Healthy' : '❌ Not responding'}`);

  // Frontend health checks
  const frontendLocal = await isServiceRunning(5173);
  const frontendDocker = await isServiceRunning(8080);
  
  console.log(`   Frontend Local (5173): ${frontendLocal ? '✅ Healthy' : '❌ Not responding'}`);
  console.log(`   Frontend Docker (8080): ${frontendDocker ? '✅ Healthy' : '❌ Not responding'}`);

  // Determine current scenario
  console.log('\\n🎯 Detected Scenario:');
  let currentScenario = 'none';
  
  if (frontendLocal && backendLocal) {
    currentScenario = 'local-local';
  } else if (frontendDocker && backendDocker) {
    currentScenario = 'docker-docker';
  } else if (frontendLocal && backendDocker) {
    currentScenario = 'local-docker';
  } else if (frontendDocker && backendLocal) {
    currentScenario = 'docker-local';
  }

  if (currentScenario !== 'none') {
    const scenario = SCENARIOS[currentScenario];
    console.log(`   Active: ${scenario.name}`);
    console.log(`   Frontend: Port ${scenario.frontend.port} (${scenario.frontend.type})`);
    console.log(`   Backend: Port ${scenario.backend.port} (${scenario.backend.type})`);
    
    // Verify API URL matches scenario
    if (envConfig.apiUrl) {
      const expectedPort = scenario.backend.port;
      const configuredPort = envConfig.apiUrl.match(/:(\d+)/)?.[1];
      
      if (configuredPort == expectedPort) {
        console.log(`   API Configuration: ✅ Correct (${envConfig.apiUrl})`);
      } else {
        console.log(`   API Configuration: ⚠️  Mismatch`);
        console.log(`     Expected: localhost:${expectedPort}`);
        console.log(`     Configured: ${envConfig.apiUrl}`);
      }
    }
  } else {
    console.log('   Active: ❌ No active scenario detected');
    console.log('   ℹ️  Start frontend and backend services to see active scenario');
  }

  // Recommendations
  console.log('\\n💡 Recommendations:');
  
  if (!envConfig.exists) {
    console.log('   1. Copy appropriate config template:');
    console.log('      cp config-templates/local-development.env .env');
  }
  
  if (currentScenario === 'none') {
    console.log('   2. Start your preferred development scenario:');
    console.log('      - See TESTING_GUIDE.md for detailed instructions');
    console.log('      - See README.md Development Scenarios section');
  }

  const conflicts = ports.filter(async port => !(await isPortAvailable(port)) && !(await isServiceRunning(port)));
  if (conflicts.length > 0) {
    console.log('   3. Resolve port conflicts by stopping unused services');
  }

  console.log('\\n✅ Verification complete!');
  console.log('   For detailed testing: see TESTING_GUIDE.md');
  console.log('   For setup help: see config-templates/README.md');
}

// Run verification if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  verifyConfiguration().catch(console.error);
}

export { verifyConfiguration, SCENARIOS };
