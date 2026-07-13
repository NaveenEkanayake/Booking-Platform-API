const http = require('http');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}/api`;

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: options.path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsedData = null;
          if (data) {
            try {
              parsedData = JSON.parse(data);
            } catch (err) {
              parsedData = data;
            }
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting API Verification Tests on port', PORT);

  try {
    // 1. Login Admin
    console.log('\n--- 1. Login Admin ---');
    const loginRes = await request(
      {
        path: '/api/auth/login',
        method: 'POST',
      },
      {
        email: 'admin@entwoh.com',
        password: 'admin123',
      }
    );

    if (loginRes.statusCode !== 201 && loginRes.statusCode !== 200) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginRes.data)}`);
    }

    const token = loginRes.data.accessToken;
    console.log('✅ Admin login successful. Token acquired.');

    // 2. Create Service
    console.log('\n--- 2. Create Service ---');
    const createServiceRes = await request(
      {
        path: '/api/services',
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      },
      {
        title: 'Temporary Test Service',
        description: 'This is a test service that will be deleted.',
        duration: 30,
        price: 99.99,
      }
    );

    if (createServiceRes.statusCode !== 201) {
      throw new Error(`Create service failed: ${JSON.stringify(createServiceRes.data)}`);
    }

    const serviceId = createServiceRes.data.id;
    console.log(`✅ Service created successfully. ID: ${serviceId}`);

    // 3. Get Service by ID
    console.log('\n--- 3. Get Service by ID ---');
    const getServiceRes = await request({
      path: `/api/services/${serviceId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (getServiceRes.statusCode !== 200) {
      throw new Error(`Get service failed: ${JSON.stringify(getServiceRes.data)}`);
    }
    console.log(`✅ Get service successful. Title: "${getServiceRes.data.title}"`);

    // 4. Delete Service
    console.log('\n--- 4. Delete Service ---');
    const deleteServiceRes = await request({
      path: `/api/services/${serviceId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (deleteServiceRes.statusCode !== 200 && deleteServiceRes.statusCode !== 204) {
      throw new Error(`Delete service failed with status ${deleteServiceRes.statusCode}: ${JSON.stringify(deleteServiceRes.data)}`);
    }
    console.log('✅ Delete service request returned success code', deleteServiceRes.statusCode);

    // 5. Verify Deletion
    console.log('\n--- 5. Verify Deletion ---');
    const verifyGetRes = await request({
      path: `/api/services/${serviceId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (verifyGetRes.statusCode === 404) {
      console.log('✅ Confirmed: Service no longer exists (404 Not Found).');
    } else {
      throw new Error(`Service still exists! Status: ${verifyGetRes.statusCode}, Data: ${JSON.stringify(verifyGetRes.data)}`);
    }

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

// Wait a bit to ensure the dev server is fully up
setTimeout(runTests, 3000);
