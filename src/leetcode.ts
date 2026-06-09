import axios from 'axios';
import { Submission, Member } from './types';

export class LeetCodePlatform {
  async getRecentSubmissions(member: Member): Promise<Submission[]> {
    const query = `
      query recentAcSubmissions($username: String!, $limit: Int) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          id
          title
          titleSlug
          timestamp
        }
      }
    `;

    try {
      const response = await axios.post('https://leetcode.com/graphql', {
        query,
        variables: { username: member.username, limit: 5 },
      });

      const submissions = response.data?.data?.recentAcSubmissionList || [];
      
      return submissions.map((s: any) => ({
        id: s.id,
        title: s.title,
        slug: s.titleSlug,
        timestamp: parseInt(s.timestamp) * 1000,
        url: `https://leetcode.com/problems/${s.titleSlug}/`,
      }));
    } catch (error) {
      console.error(`Error fetching LeetCode for ${member.username}:`, error);
      return [];
    }
  }
}
