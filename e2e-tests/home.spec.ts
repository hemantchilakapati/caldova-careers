import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive the expected posting count from the job content collection so this
// assertion stays correct as roles are added or removed.
const jobsDir = fileURLToPath(new URL('../src/content/jobs', import.meta.url));
const expectedRoleCount = readdirSync(jobsDir).filter((f) => f.endsWith('.md')).length;

test.describe('Open roles listing', () => {
    test('shows the roles grid with all postings', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

        const grid = page.getByTestId('roles-grid');
        await expect(grid).toBeVisible();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
    });

    test('filters roles by department', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('department-filter').selectOption({ label: 'Technology' });

        const cards = page.locator('[data-testid="role-card"]:visible');
        await expect(cards).toHaveCount(2);
        await expect(cards.first()).toHaveAttribute('data-department', 'Technology');
        await expect(page.getByTestId('filter-results-count')).toHaveText('Showing 2 roles.');
    });

    test('filters roles by location', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('location-filter').selectOption({
            label: 'Vancouver, Canada',
        });

        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(2);
        await expect(
            page.locator('[data-testid="role-card"]:visible [data-testid="role-location"]'),
        ).toHaveText([
            'Vancouver, Canada',
            'Vancouver, Canada',
        ]);
    });

    test('combines department and location filters and resets them', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('department-filter').selectOption({ label: 'Finance' });
        await page.getByTestId('location-filter').selectOption({
            label: 'Woodinville, WA, USA',
        });

        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(1);
        await expect(
            page.locator('[data-testid="role-card"]:visible [data-testid="role-title"]'),
        ).toHaveText('Financial Analyst');

        await page.getByTestId('filter-reset').click();
        await expect(page.getByTestId('department-filter')).toHaveValue('');
        await expect(page.getByTestId('location-filter')).toHaveValue('');
        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(
            expectedRoleCount,
        );
    });

    test('shows an empty state when no roles match', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('department-filter').selectOption({ label: 'Compliance' });
        await page.getByTestId('location-filter').selectOption({
            label: 'Helsinki, Finland',
        });

        await expect(page.getByTestId('roles-grid')).toBeHidden();
        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(0);
        await expect(page.getByTestId('filter-empty-state')).toBeVisible();

        await page.getByTestId('filter-reset').click();
        await expect(page.getByTestId('roles-grid')).toBeVisible();
        await expect(page.getByTestId('filter-empty-state')).toBeHidden();
        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(
            expectedRoleCount,
        );
    });

    test('links through to a role detail page', async ({ page }) => {
        await page.goto('/');
        const firstCard = page.getByTestId('role-card').first();
        const title = await firstCard.getByTestId('role-title').textContent();
        await firstCard.click();
        await expect(page.getByTestId('role-detail-title')).toHaveText(title!.trim());
        await expect(page.getByTestId('apply-form')).toBeVisible();
    });

    for (const { title, location } of [
        { title: 'Senior Frontend Engineer', location: 'Remote (US & Canada)' },
        { title: 'Financial Analyst', location: 'Woodinville, WA, USA' },
    ]) {
        test(`shows ${title} location on the card and details`, async ({ page }) => {
            await page.goto('/');
            const card = page.getByTestId('role-card').filter({
                has: page.getByRole('heading', { name: title, exact: true }),
            });

            await expect(card).toBeVisible();
            await expect(card.getByTestId('role-location')).toHaveText(location);
            await card.click();
            await expect(page.getByText(location, { exact: true })).toBeVisible();
        });
    }

    test('has no automatically detectable accessibility violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
