import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * MSW Request Handlers
 * Mock API responses for testing
 */
export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as any;

    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      });
    }

    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as any;

    return HttpResponse.json({
      user: {
        id: '1',
        email: body.email,
        name: body.name,
        role: 'user',
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
    });
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.get(`${API_BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    });
  }),

  // Example feature endpoints
  http.get(`${API_BASE_URL}/example/items`, () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Example Item 1',
        description: 'This is a test item',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Example Item 2',
        description: 'Another test item',
        status: 'inactive',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }),

  http.get(`${API_BASE_URL}/example/items/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      title: `Example Item ${params.id}`,
      description: 'This is a test item',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE_URL}/example/items`, async ({ request }) => {
    const body = (await request.json()) as any;

    return HttpResponse.json({
      id: '3',
      ...body,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  http.patch(`${API_BASE_URL}/example/items/:id`, async ({ params, request }) => {
    const body = (await request.json()) as any;

    return HttpResponse.json({
      id: params.id,
      title: 'Updated Item',
      description: 'Updated description',
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete(`${API_BASE_URL}/example/items/:id`, () => {
    return HttpResponse.json({ success: true });
  }),
];

