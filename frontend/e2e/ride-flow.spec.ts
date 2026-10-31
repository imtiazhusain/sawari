import { expect, test } from '@playwright/test';

test('rider books a ride, a driver accepts it, the rider sees the driver', async ({ page, request }) => {
  await page.goto('/');

  await page.getByLabel('Pickup').fill('Liberty');
  await page.getByRole('option', { name: /Liberty Market/ }).click();
  await page.getByLabel('Destination').fill('Packages');
  await page.getByRole('option', { name: /Packages Mall/ }).click();

  await expect(page.getByText(/Rs\s?\d+/).first()).toBeVisible(); // fare estimate appears
  await page.getByRole('button', { name: /Request Economy/ }).click();
  await expect(page.getByText('Finding your driver')).toBeVisible();

  // Act as a driver through the public API.
  const { data: drivers } = await (await request.get('/api/v1/drivers')).json();
  const driver = drivers.find((d: { category: string; status: string }) => d.category === 'economy' && d.status === 'available');
  const rideId = await page.evaluate(() => window.localStorage.getItem('sawari.activeRideId'));
  const accepted = await request.post(`/api/v1/rides/${JSON.parse(rideId!)}/accept`, { data: { driverId: driver.id } });
  expect(accepted.ok()).toBeTruthy();

  await expect(page.getByText(driver.name)).toBeVisible({ timeout: 10_000 }); // status poll picks it up
  await page.getByRole('button', { name: 'Cancel ride' }).click();
  await expect(page.getByText('Ride cancelled')).toBeVisible();
});
