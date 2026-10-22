import { describe, it, expect } from 'vitest';
import { filterJobs, sortByNewest, formatPostedDate } from './jobs';
import type { Job } from '../types/job';

/** Create a small role fixture for pure helper tests. */
function makeJob(
    slug: string,
    postedDate: string,
    department = 'Technology',
    location = 'Remote',
): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department,
        location,
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('filterJobs', () => {
    const jobs = [
        makeJob('remote-tech', '2027-01-01', 'Technology', 'Remote (US & Canada)'),
        makeJob('finance-helsinki', '2027-02-01', 'Finance', 'Helsinki, Finland'),
        makeJob('finance-woodinville', '2027-03-01', 'Finance', 'Woodinville, WA, USA'),
    ];

    it('filters by department', () => {
        expect(filterJobs(jobs, { department: 'Finance' }).map((job) => job.slug)).toEqual([
            'finance-helsinki',
            'finance-woodinville',
        ]);
    });

    it('filters by location', () => {
        expect(filterJobs(jobs, { location: 'Helsinki, Finland' }).map((job) => job.slug)).toEqual([
            'finance-helsinki',
        ]);
    });

    it('combines department and location filters with AND', () => {
        expect(
            filterJobs(jobs, { department: 'Finance', location: 'Woodinville, WA, USA' }).map(
                (job) => job.slug,
            ),
        ).toEqual(['finance-woodinville']);
        expect(
            filterJobs(jobs, { department: 'Technology', location: 'Helsinki, Finland' }),
        ).toEqual([]);
    });

    it('returns all jobs when no filters are selected', () => {
        expect(filterJobs(jobs, {}).map((job) => job.slug)).toEqual([
            'remote-tech',
            'finance-helsinki',
            'finance-woodinville',
        ]);
    });

    it('returns no jobs for unmatched criteria', () => {
        expect(filterJobs(jobs, { department: 'Compliance' })).toEqual([]);
    });

    it('returns no jobs for an empty input', () => {
        expect(filterJobs([], { department: 'Finance', location: 'Helsinki, Finland' })).toEqual(
            [],
        );
    });
});

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-03-15'),
            makeJob('c', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('a', '2027-01-01'), makeJob('b', '2027-03-15')];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});
