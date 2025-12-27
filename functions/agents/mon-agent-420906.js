/**
 * Agent: Social Media Article Summarizer and Image Generator
 * Route: /api/agents/[id]/execute (POST ou GET)
 * Schedule: 0 9 * * * (daily at 9 AM to get latest article)
 */

import { jsonResponse, errorResponse } from '../../../shared/utils.js';

/**
 * Exécute l'agent (POST)
 */
export async function onRequestPost(context) {
  return handleAgent(context);
}

/**
 * Exécute l'agent (GET)
 */
export async function onRequestGet(context) {
  return handleAgent(context);
}

async function handleAgent(context) {
  const { env } = context;

  try {
    // 1. Validate required environment variables
    if (!env.GOOGLE_AI_KEY) {
      return errorResponse('Missing GOOGLE_AI_KEY environment variable.', 400);
    }
    if (!env.PEXELS_API_KEY) {
      return errorResponse('Missing PEXELS_API_KEY environment variable.', 400);
    }

    // 2. Fetch the latest blog article
    const postsResponse = await fetch('/api/posts');
    if (!postsResponse.ok) {
      throw new Error(`Failed to fetch blog posts: ${postsResponse.statusText}`);
    }
    const posts = await postsResponse.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      return jsonResponse({ success: false, message: "No blog posts found to summarize." }, 200);
    }

    // Assuming the API returns posts sorted by date, take the first one as the latest.
    // Or, sort them if not guaranteed: posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestArticle = posts[0];

    // Ensure content exists for summarization
    if (!latestArticle.title && !latestArticle.description && !latestArticle.content) {
      return errorResponse('Latest article missing title, description, or content for summarization.', 404);
    }

    const articleTitle = latestArticle.title || 'Untitled Article';
    const articleContent = latestArticle.description || latestArticle.content || articleTitle; // Use description or content

    // 3. Summarize the article using Google Gemini AI
    const googleAiKey = env.GOOGLE_AI_KEY;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleAiKey}`;
    
    const prompt = `Please summarize the following blog article for social media. Make it concise (under 280 characters), engaging, and include a call to action like "Read more". Focus on the main topic and a key takeaway.
    
    Article Title: "${articleTitle}"
    Article Content: "${articleContent.substring(0, 1000)}..."`; // Limit content length for prompt

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Google Gemini API failed (${geminiResponse.status}): ${errorText}`);
    }
    const geminiData = await geminiResponse.json();
    const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate summary.";

    // 4. Find an illustrative image using Pexels API
    const pexelsApiKey = env.PEXELS_API_KEY;
    // Use the first few words of the title as a search query
    const pexelsQuery = encodeURIComponent(articleTitle.split(' ').slice(0, 5).join(' '));
    const pexelsUrl = `https://api.pexels.com/v1/search?query=${pexelsQuery}&per_page=1&orientation=landscape`;

    const pexelsResponse = await fetch(pexelsUrl, {
      headers: { Authorization: pexelsApiKey }
    });

    if (!pexelsResponse.ok) {
      const errorText = await pexelsResponse.text();
      throw new Error(`Pexels API failed (${pexelsResponse.status}): ${errorText}`);
    }
    const pexelsData = await pexelsResponse.json();
    const imageUrl = pexelsData.photos?.[0]?.src?.large || "No suitable image found from Pexels.";

    // 5. Return the aggregated result
    const result = {
      success: true,
      message: "Latest blog article summarized and image retrieved for social media.",
      timestamp: new Date().toISOString(),
      data: {
        article: {
          id: latestArticle.id,
          title: latestArticle.title,
          url: latestArticle.url, // Assuming articles have a URL property
          published_date: latestArticle.published_date, // Assuming articles have a published_date property
        },
        summary_for_social_media: summary,
        illustration_image_url: imageUrl
      }
    };

    return jsonResponse(result);
  } catch (error) {
    console.error("Agent error:", error); // Log the full error for debugging
    return errorResponse(`Erreur lors de l'exécution de l'agent: ${error.message}`, 500);
  }
}