# TUM Systems and Access Methods

## Table of Contents
- [Code of Conduct](#️-code-of-conduct)
- [Moodle (moodle.tum.de)](#moodle-moodletumde)
- [Collab Wiki (collab.dvb.bayern)](#collab-wiki-collabdvbbayern)
- [Mensa and StuCafé Menus](#mensa-and-stucafé-menus)
- [TUMonline (Courses, Schedules, Exams)](#tumonline-courses-schedules-exams)
- [Matrix (Chat & Messaging)](#matrix-chat--messaging)
- [Navigatum (Campus Navigation & Maps)](#navigatum-campus-navigation--maps)
- [Public Transport (MVV / MVG)](#public-transport-mvv--mvg)
- [General Web Scraping Tools](#general-web-scraping-tools)
- [Community & Resources](#community--resources)

## ⚠️ Code of Conduct
When building applications or scripts that interact with university-provided systems, you **must act responsibly**:
*   **Do No Harm:** Do not perform actions that could overwhelm or DDoS university infrastructure.
*   **Rate Limits:** Always rigorously rate-limit your API requests and web scraping scripts.
*   **Data Privacy:** Never expose your personal setup, credentials, Access Tokens, or private student data in public Git repositories.

This document outlines the various digital systems provided by the Technical University of Munich (TUM) and the known methods for accessing them programmatically or via automation.

## Moodle (moodle.tum.de)

Moodle is the primary learning management system for course materials, assignments, and announcements.

**Access Method:**
*   **API Availability:** Currently, there is no official, publicly accessible API available for students to access TUM's Moodle.
*   **Workaround:** Browser automation tools are often used as a workaround to access Moodle. They allow you to automate the TUM Single Sign-On (SSO) login process, navigate the platform, and extract course data or materials directly from the DOM. See the [General Web Scraping Tools](#general-web-scraping-tools) section at the bottom of this document for recommended frameworks (like Playwright or Selenium).

## Collab Wiki (collab.dvb.bayern)

The Collab Wiki is a Confluence-based wiki system used for collaborative documentation and projects across Bavarian universities.

**Access Method:**
*   **API Availability:** Since it is based on Atlassian Confluence, it exposes the standard Confluence REST API.
*   **Authentication (Personal Access Token):** It is highly recommended to authenticate via a Personal Access Token rather than your direct password.
    *   Login to the wiki.
    *   Navigate to your personal account: **Profile picture -> Settings -> Personal Access Tokens**.
    *   Alternatively, you can access the token creation page directly: [Create Token](https://collab.dvb.bayern/plugins/personalaccesstokens/usertokens.action).
*   **Python Integration:** To interact with the Confluence API in Python, the recommended and most widely used module is `atlassian-python-api`.
    *   **Installation:** 
        ```bash
        pip install atlassian-python-api
        ```
    *   **Documentation:** [atlassian-python-api ReadTheDocs](https://atlassian-python-api.readthedocs.io/)
    *   **GitHub Repository:** [atlassian-api/atlassian-python-api](https://github.com/atlassian-api/atlassian-python-api)
    *   **Example Usage:**
        ```python
        from atlassian import Confluence

        confluence = Confluence(
            url='https://collab.dvb.bayern',
            token='your_personal_access_token'
        )
        ```

## Mensa and StuCafé Menus

Information about the daily menus served by the canteens and cafes (Mensa, StuCafé, StuBistro) operated by the Munich Student Union (Studierendenwerk München).

**Access Method:**
*   **API Availability:** Yes.
*   **1. TUM-Dev "Eat API":** This is a popular community-driven, static JSON API that provides easy access to cleanly parsed menu data for TUM locations.
    *   **Endpoints:** Access menus using the format `https://tum-dev.github.io/eat-api/<canteen-id>/<year>/<week-number>.json` (e.g., `.../mensa-garching/2023/45.json`).
    *   **Documentation:** [TUM-Dev Eat API](https://tum-dev.github.io/eat-api/docs/)
    *   **GitHub Repository:** [TUM-Dev/eat-api](https://github.com/TUM-Dev/eat-api)
*   **2. OpenMensa API:** A widely used, open-source centralized API that aggregates canteen menus across Germany, including Munich.
    *   **API Documentation:** [OpenMensa API v2](https://openmensa.org/api/v2/)

## TUMonline (Courses, Schedules, Exams)

TUMonline is the overarching campus management system used for course registration, schedule management, and exam administration at TUM.

**Access Method:**
*   **API Availability:** The TUM School of Natural Sciences maintains a public API that provides access to comprehensive TUMonline data, including courses, schedules, people, and rooms.
*   **API Documentation:** [TUM NAT API Documentation (Swagger/OpenAPI)](https://api.srv.nat.tum.de/docs)
*   **Alternative (Web Automation/Scraping):** You can also use browser automation tools or crawling frameworks to automate interactions or scrape data that the API might not provide. Check out the [General Web Scraping Tools](#general-web-scraping-tools) section for options like Playwright, Scrapy, or BeautifulSoup.
    *   ⚠️ **IMPORTANT - Use the Demo Environment:** When writing and testing your scripts, **DO NOT** use the live TUMonline. You should use the shadow copy at `demo.campus.tum.de`. This ensures that your automated actions (like registering/deregistering) will not affect your actual student data.

## Matrix (Chat & Messaging)

TUM provides a Matrix server for secure, federated chat communications and group messaging. Because it is based on the open Matrix protocol, it is highly suitable for building integrations and chatbots.

**Access Method:**
*   **API & Integration:** You can interact with the server using standard Matrix APIs. Python provides libraries like `matrix-nio` or `simplematrixbotlib` to easily create chat bots that can listen for commands and send alerts.
*   **Documentation & Setup:** Official instructions for accessing and configuring the TUM Matrix service can be found on the CIT Wiki:
    [TUM Matrix Service Setup Guide](https://wiki.ito.cit.tum.de/bin/view/CIT/ITO/Docs/Services/Matrix/Einrichtung/)

### Getting a Matrix Access Token

If you are building a custom integration or connecting to a Matrix server (like the official `matrix.org` or TUM's Matrix servers), you will need a long-lived access token.

**WARNING:** Do **NOT** use the access token you get from debugging a standard chat client (like Element). Regular clients often negotiate short-lived tokens and support token refresh (`refresh_token: true`). If you use that token, it will expire after a limited amount of time.

To ensure you get a **long-living token**, log in directly via the API using `curl`. Make sure to adjust the server URL to your specific homeserver and provide your username/password.

```bash
curl --header "Content-Type: application/json" \
     --request POST \
     --data '{"password": "YOUR_PASSWORD", "type": "m.login.password", "identifier": {"type": "m.id.user", "user": "YOUR_USERNAME"}}' \
     https://matrix.org/_matrix/client/v3/login
```

**Expected Response**
The response will provide your `access_token`, which you can use for your bots and integrations:

```json
{
    "user_id": "@YOUR_USERNAME:matrix.org",
    "access_token": "...",
    "home_server": "matrix.org",
    "device_id": "???",
    "well_known": {
        "m.homeserver": {
            "base_url": "https://matrix-client.matrix.org/"
        }
    }
}
```

## Navigatum (Campus Navigation & Maps)

Navigatum (`nav.tum.de`) is the official interactive map system for TUM campuses. It provides routing and helps locate specific rooms, lecture halls, and buildings.

**Access Method:**
*   **API Availability:** Navigatum exposes an open REST API (documented via Swagger) which you can query to get coordinate data, locations, and room details.
*   **API Documentation:** [Navigatum Locations API](https://nav.tum.de/api#tag/locations/operation/get_handler)

## Public Transport (MVV / MVG)

For retrieving live departure times, train/bus/tram schedules, and routing around TUM campuses (Munich, Garching, Weihenstephan), integrating with the regional transit authority is recommended.

**Access Method:**
*   **API Availability:** The MVV (Münchner Verkehrs- und Tarifverbund) offers developers access to their timetable data through the standard TRIAS (Traveller Realtime Information and Advisory Standard) interface.
*   **API Documentation:** [MVV TRIAS Interface for Developers](https://www.mvv-muenchen.de/fahrplanauskunft/fuer-entwickler/trias-schnittstelle/index.html)
*   **Python Integration (Recommended):** Instead of manually managing the XML-based TRIAS API requests, there is a dedicated Python package that elegantly wraps the MVG/MVV API for simple usage.
    *   **Installation:** 
        ```bash
        pip install mvg
        ```
    *   **PyPI Package:** [mvg on PyPI](https://pypi.org/project/mvg/)

## General Web Scraping Tools

If an API is missing or incomplete (for example, gathering general news or directory information directly from `tum.de`), you may need to build your own web scraper. Remember to keep the Code of Conduct (Rate Limiting) in mind!

### Recommended Frameworks
*   **[BeautifulSoup (Python)](https://www.crummy.com/software/BeautifulSoup/bs4/doc/):** The standard for simple scraping of static HTML pages. It allows you to parse HTML efficiently and extract elements effortlessly. Combine with the `requests` library.
*   **[Playwright (Python / Node.js)](https://playwright.dev/):** A modern, incredibly fast, and reliable framework by Microsoft for full browser automation. It is the best choice when dealing with Single Sign-On (SSO) login walls or Heavy JavaScript applications that render data dynamically.
*   **[Selenium (Python / Node.js)](https://www.selenium.dev/):** The robust, industry-standard alternative to Playwright for browser automation. Also widely used for scraping dynamic content or automating interactions.
*   **[Scrapy (Python)](https://scrapy.org/):** A highly extensible and powerful framework best used when you need to crawl hundreds or thousands of pages (e.g., spidering the entire `tum.de` domain). **Note:** Explicitly configure Scrapy's built-in `DOWNLOAD_DELAY` to respect university servers!

## Community & Resources

If you want to discover more hidden APIs, gather inspiration, or connect with other student developers working on the TUM ecosystem, be sure to check out these resources:

*   **[TUM-Dev](https://www.tum.dev/):** An active community of developers building software for students. They maintain core ecosystem apps like the Eat API, and joining them is a great way to get help during hackathons.
*   **[tum.sexy](https://tum.sexy/):** A community-maintained link directory pointing to a variety of useful, open-source, or hidden platforms and services around TUM. *(Disclaimer: Many of the linked projects and infrastructure are heavily focused on Computer Science / Informatics.)* Still, it is an excellent spot to discover existing APIs and projects!
