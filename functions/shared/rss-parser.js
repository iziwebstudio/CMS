// ====================================================================
// PARSING RSS - FONCTIONS PARTAGÉES
// ====================================================================

import {
    slugify,
    decodeHTMLEntities,
    extractFirstImage,
    extractEnclosureImage,
    cleanHtmlContent
} from './utils.js';

/**
 * Extrait les métadonnées du canal RSS
 */
export function extractChannelMetadata(xml) {
    const getChannelTag = (tag) => {
        const re = new RegExp(`<channel>(?:.|[\\r\\n])*?<${tag}[^>]*>((.|[\\r\\n])*?)<\\/${tag}>`, 'i');
        const found = xml.match(re);
        if (!found) return "";
        let content = found[1].trim();
        if (content.startsWith('<![CDATA[')) {
            content = content.slice(9, -3).trim();
        }
        return decodeHTMLEntities(content);
    };

    return {
        blogTitle: getChannelTag('title'),
        blogUrl: getChannelTag('link'),
        lastBuildDate: getChannelTag('lastBuildDate'),
        blogDescription: getChannelTag('description')
    };
}

/**
 * Parse les articles d'un flux RSS Substack
 */
export function parseSubstackRSS(xml) {
    const items = [];
    const itemRe = /<item[^>]*>((.|[\r\n])*?)<\/item>/gi;
    let m;

    while ((m = itemRe.exec(xml)) !== null) {
        const block = m[1];
        const getTag = (tag) => {
            const re = new RegExp(`<${tag}[^>]*>((.|[\\r\\n])*?)<\\/${tag}>`, 'i');
            const found = block.match(re);
            if (!found) return "";
            let content = found[1].trim();
            if (content.startsWith('<![CDATA[')) {
                content = content.slice(9, -3).trim();
            }
            return decodeHTMLEntities(content);
        };

        const title = getTag('title');
        const link = getTag('link');
        const pubDate = getTag('pubDate');
        const description = getTag('description');

        let image = extractEnclosureImage(block);

        // Contenu complet
        let contentFull = "";
        const contentEncodedRe = /<content:encoded[^>]*>((.|[\r\n])*?)<\/content:encoded>/i;
        const contentEncodedMatch = block.match(contentEncodedRe);

        if (contentEncodedMatch) {
            let content = contentEncodedMatch[1].trim();
            if (content.startsWith('<![CDATA[')) {
                content = content.slice(9, -3).trim();
            }
            contentFull = decodeHTMLEntities(content);
            contentFull = cleanHtmlContent(contentFull);

            if (!image) {
                image = extractFirstImage(contentFull);
            }
        } else {
            contentFull = description;
        }

        items.push({
            title,
            link,
            pubDate,
            description,
            slug: slugify(title),
            content: contentFull,
            image
        });
    }

    // Trier par date (plus récent d'abord)
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    return items;
}

/**
 * Parse les vidéos d'un flux RSS YouTube
 */
export function parseYoutubeRSS(xml) {
    const items = [];
    const entryRe = /<entry[^>]*>((.|[\r\n])*?)<\/entry>/gi;
    let m;

    while ((m = entryRe.exec(xml)) !== null) {
        const block = m[1];
        const getTag = (tag) => {
            const re = new RegExp(`<${tag}[^>]*>((.|[\\r\\n])*?)<\\/${tag}>`, 'i');
            const found = block.match(re);
            return found ? decodeHTMLEntities(found[1].trim()) : "";
        };

        const title = getTag('title');
        const published = getTag('published');

        // Extract Video ID
        const videoIdRe = /<yt:videoId>((.|[\r\n])*?)<\/yt:videoId>/i;
        const videoIdMatch = block.match(videoIdRe);
        const videoId = videoIdMatch ? videoIdMatch[1].trim() : "";

        // Extract Thumbnail & Description
        const mediaGroupRe = /<media:group>((.|[\r\n])*?)<\/media:group>/i;
        const mediaGroupMatch = block.match(mediaGroupRe);
        let thumbnail = "";
        let description = "";

        if (mediaGroupMatch) {
            const groupContent = mediaGroupMatch[1];
            const thumbRe = /<media:thumbnail\s+url=["']([^"']+)["']/i;
            const thumbMatch = groupContent.match(thumbRe);
            if (thumbMatch) thumbnail = thumbMatch[1];

            const descRe = /<media:description[^>]*>((.|[\r\n])*?)<\/media:description>/i;
            const descMatch = groupContent.match(descRe);
            if (descMatch) description = decodeHTMLEntities(descMatch[1].trim());
        }

        if (videoId) {
            items.push({
                id: videoId,
                title,
                published,
                thumbnail,
                description,
                link: `https://www.youtube.com/watch?v=${videoId}`
            });
        }
    }

    // Trier par date desc
    items.sort((a, b) => new Date(b.published) - new Date(a.published));

    return items;
}

/**
 * Parse les épisodes d'un flux RSS Podcast
 */
export function parsePodcastRSS(xmlText) {
    const items = [];
    let currentPos = 0;

    while (true) {
        const itemStart = xmlText.indexOf("<item>", currentPos);
        if (itemStart === -1) break;

        const itemEnd = xmlText.indexOf("</item>", itemStart);
        if (itemEnd === -1) break;

        const itemContent = xmlText.substring(itemStart, itemEnd);

        const titleMatch = itemContent.match(/<title>(.*?)<\/title>/s);
        const linkMatch = itemContent.match(/<link>(.*?)<\/link>/s);
        const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/s);
        const descriptionMatch = itemContent.match(/<description>(.*?)<\/description>/s);
        const enclosureMatch = itemContent.match(/<enclosure[^>]*url=["'](.*?)["'][^>]*>/s);
        const guidMatch = itemContent.match(/<guid[^>]*>(.*?)<\/guid>/s);

        const clean = (str) => {
            if (!str) return "";
            return str.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim();
        };

        const title = clean(titleMatch ? titleMatch[1] : "Sans titre");

        items.push({
            title,
            slug: slugify(title),
            guid: clean(guidMatch ? guidMatch[1] : ""),
            link: clean(linkMatch ? linkMatch[1] : "#"),
            pubDate: clean(pubDateMatch ? pubDateMatch[1] : ""),
            description: clean(descriptionMatch ? descriptionMatch[1] : ""),
            audioUrl: enclosureMatch ? enclosureMatch[1] : null
        });

        currentPos = itemEnd + 7;
    }

    // Trier par date desc
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    return items;
}

/**
 * Parse les événements d'un flux RSS Meetup
 * Format RSS 2.0 standard avec contenu riche dans la description
 */
export function parseMeetupEventsRSS(xmlText) {
    const items = [];
    const itemRe = /<item[^>]*>((.|[\r\n])*?)<\/item>/gi;
    let m;

    while ((m = itemRe.exec(xmlText)) !== null) {
        const block = m[1];
        
        const getTag = (tag) => {
            const re = new RegExp(`<${tag}[^>]*>((.|[\\r\\n])*?)<\\/${tag}>`, 'i');
            const found = block.match(re);
            if (!found) return "";
            let content = found[1].trim();
            if (content.startsWith('<![CDATA[')) {
                content = content.slice(9, -3).trim();
            }
            return decodeHTMLEntities(content);
        };

        const title = getTag('title');
        const link = getTag('link');
        const guid = getTag('guid');
        const pubDate = getTag('pubDate');
        const description = getTag('description');

        // Extraire l'image depuis enclosure ou depuis la description
        let image = extractEnclosureImage(block);
        if (!image) {
            image = extractFirstImage(description);
        }

        // Extraire les informations structurées depuis la description (optionnel)
        // Meetup utilise des emojis et du formatage pour structurer les infos
        const locationMatch = description.match(/(?:📍|Lieu|Location)[:\s]+(?:<strong>)?([^<\n]+)/i);
        const feeMatch = description.match(/(?:💶|Prix|Fee)[:\s]+(?:<strong>)?([^<\n]+)/i);
        const contactMatch = description.match(/(?:📱|Contact)[:\s]+(?:<strong>)?([^<\n]+)/i);

        // Nettoyer le contenu HTML
        const contentFull = cleanHtmlContent(description);

        items.push({
            title,
            link,
            pubDate,
            description: contentFull.substring(0, 300) + (contentFull.length > 300 ? '...' : ''), // Description courte
            slug: slugify(title),
            content: contentFull, // Contenu complet
            image,
            guid: guid || link,
            location: locationMatch ? locationMatch[1].trim() : null,
            fee: feeMatch ? feeMatch[1].trim() : null,
            contact: contactMatch ? contactMatch[1].trim() : null,
            type: 'event'
        });
    }

    // Trier par date (plus récent d'abord, comme les articles)
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    return items;
}
