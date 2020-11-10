const { getSyncClient, agilityConfig } = require('../../agility/agility.config')
const moment = require("moment")

async function getAgilityContent() {

	const languageCode = agilityConfig.languageCode
	const channelName = agilityConfig.channelName
	const isPreview = agilityConfig.isPreviewMode

	if (isPreview) {
		console.log("Agility CMS => Building site in preview mode.")
	} else {
		console.log("Agility CMS => Building site in live mode.")
	}

    const syncClient = getSyncClient({isPreview})

	let sitemap = await syncClient.store.getSitemap({ channelName, languageCode })

	if (! sitemap) {
		console.warn("Agility CMS => No Sitemap Found - try running a sync (npm run cms-pull)")
	}

	let pages = []
	for (const key in sitemap) {

		let node = sitemap[key]

		if (node.isFolder || node.redirect) {
			continue
		}

		//get the page for this sitemap object
		let page = await syncClient.store.getPage({pageID: node.pageID, languageCode, contentLinkDepth: 3})


		//the first page in the sitemap is always the home page
		if (pages.length === 0) {
			node.path = "/"
		}

		page.sitemapNode = node;

		//resolve the page template
		if (page.templateName !== undefined && page.templateName) {
			page.templateFileName = `${page.templateName.replace(/ /ig, '-').toLowerCase()}`
		}


		//if this is a dynamic page item, get the content for it
		page.dynamicPageItem = null
		if (node.contentID !== undefined && node.contentID > 0) {
			const dynamicPageItem = await syncClient.store.getContentItem({ contentID: node.contentID, languageCode, contentLinkDepth: 2 })


			if (dynamicPageItem) {
				page.title = dynamicPageItem.fields.title
				if (dynamicPageItem.seo) {
					page.seo.metaDescription = dynamicPageItem.seo.metaDescription
				}

				if (dynamicPageItem.properties.definitionName === "Post") {

					dynamicPageItem.tagNames = dynamicPageItem.fields.tags.map(p => p.fields.title).join(",")
					dynamicPageItem.dateStr =  moment(dynamicPageItem.fields.date).format("ll")

					if (dynamicPageItem.fields.image) {
						page.seo.ogImage =  `${dynamicPageItem.fields.image.url}?w=1024`
					}
				}

				page.dynamicPageItem = dynamicPageItem

			}

		}

		pages.push(page)

	}

    return pages
}

// export for 11ty
module.exports = getAgilityContent;