import { hc } from 'hono/client';
// @ts-ignore
import type { AppType } from './apps/api/src/index';

const API_URL = 'http://localhost:3001';

async function main() {
  try {
    const ts = Date.now();
    const slug = `scratch-${ts}`;
    
    console.log('Registering...');
    const regRes = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: `Test ${ts}`,
        slug: slug,
        adminName: 'Admin',
        email: `admin${ts}@test.com`,
        password: 'password123'
      })
    });
    const regData = await regRes.json();
    console.log('Reg:', JSON.stringify(regData, null, 2));
    
    console.log('Logging in...');
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companySlug: slug,
        email: `admin${ts}@test.com`,
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status);
    if (!loginData.accessToken) {
        console.log('Login failed:', loginData);
        return;
    }
    const token = loginData.accessToken;

    console.log('Creating asset...');
    const assetRes = await fetch(`${API_URL}/api/assets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Asset',
        categoryId: 1,
        locationId: 1,
        departmentId: 1,
        status: 'active',
        condition: 'good',
        purchaseDate: '',
        purchasePrice: '',
        serialNumber: '',
        brand: '',
        warrantyExpiry: ''
      })
    });
    
    console.log('Asset Create Status:', assetRes.status);
    const assetData = await assetRes.text();
    console.log('Asset Response:', assetData);
    
  } catch (err) {
    console.error(err);
  }
}

main();
