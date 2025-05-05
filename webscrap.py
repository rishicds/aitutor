"""
Board Exam PYQ Scraper

This script scrapes previous year question papers from various educational board websites
and stores them in local files with metadata.

Supports:
- CBSE (Central Board of Secondary Education)
- ICSE (Indian Certificate of Secondary Education)
- WB (West Bengal Board)
"""

import os
import re
import json
import requests
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin, urlparse

import pandas as pd
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("scraper.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constants
DOWNLOAD_DIR = "downloads"
METADATA_DIR = "metadata"
SCRAPING_URLS = {
    "CBSE": [
        {
            "url": "https://cbseacademic.nic.in/qbarchive.html",
            "pattern": "question papers",
            "requires_js": True
        },
        {
            "url": "https://www.cbse.gov.in/cbsenew/question-paper.html",
            "pattern": "Previous Year Question Papers",
            "requires_js": True
        }
    ],
    "ICSE": [
        {
            "url": "https://cisce.org/DownloadPapers.aspx",
            "pattern": "Question Papers",
            "requires_js": True
        }
    ],
    "WB": [
        {
            "url": "https://wbchse.wb.gov.in/Question-Papers",
            "pattern": "Question Papers",
            "requires_js": False
        }
    ]
}

class BoardExamScraper:
    """Main scraper class that handles extraction of PYQs from different board websites"""
    
    def __init__(self):
        """Initialize the scraper with necessary directories"""
        self._setup_directories()
        self.browser = None
        
    def _setup_directories(self):
        """Create necessary directories if they don't exist"""
        for directory in [DOWNLOAD_DIR, METADATA_DIR]:
            if not os.path.exists(directory):
                os.makedirs(directory)
                logger.info(f"Created directory: {directory}")
    
    def _init_browser(self):
        """Initialize a headless browser for JavaScript-enabled pages"""
        if not self.browser:
            try:
                chrome_options = Options()
                chrome_options.add_argument("--headless")
                chrome_options.add_argument("--no-sandbox")
                chrome_options.add_argument("--disable-dev-shm-usage")
                chrome_options.add_experimental_option(
                    "prefs", {"download.default_directory": os.path.abspath(DOWNLOAD_DIR)}
                )
                
                service = Service(ChromeDriverManager().install())
                self.browser = webdriver.Chrome(service=service, options=chrome_options)
                logger.info("Browser initialized successfully")
            except Exception as e:
                logger.error(f"Browser initialization failed: {str(e)}")
                raise
    
    def close_browser(self):
        """Close the browser instance if it exists"""
        if self.browser:
            self.browser.quit()
            self.browser = None
            logger.info("Browser closed")
    
    def scrape_all_boards(self):
        """Scrape PYQs from all configured board websites"""
        logger.info("Starting to scrape all boards")
        results = {}
        
        for board, urls in SCRAPING_URLS.items():
            logger.info(f"Processing board: {board}")
            board_results = []
            
            for url_config in urls:
                try:
                    if url_config.get("requires_js", False):
                        self._init_browser()
                        papers = self._scrape_with_browser(board, url_config)
                    else:
                        papers = self._scrape_with_requests(board, url_config)
                    
                    if papers:
                        board_results.extend(papers)
                except Exception as e:
                    logger.error(f"Error scraping {board} from {url_config['url']}: {str(e)}")
            
            results[board] = board_results
            self._save_to_json(board, board_results)
            
        self.close_browser()
        return results
    
    def _scrape_with_requests(self, board: str, url_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Scrape a website that doesn't require JavaScript"""
        url = url_config["url"]
        pattern = url_config["pattern"]
        
        logger.info(f"Scraping {url} with requests")
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            return self._extract_papers(soup, board, url, pattern)
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed for {url}: {str(e)}")
            return []
    
    def _scrape_with_browser(self, board: str, url_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Scrape a website that requires JavaScript using Selenium"""
        url = url_config["url"]
        pattern = url_config["pattern"]
        
        logger.info(f"Scraping {url} with browser")
        try:
            self.browser.get(url)
            
            # Wait for page to load completely
            WebDriverWait(self.browser, 20).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Additional wait to ensure dynamic content is loaded
            self.browser.implicitly_wait(5)
            
            # Get the page source and parse with BeautifulSoup
            soup = BeautifulSoup(self.browser.page_source, 'html.parser')
            return self._extract_papers(soup, board, url, pattern)
        except Exception as e:
            logger.error(f"Browser scraping failed for {url}: {str(e)}")
            return []
    
    def _extract_papers(self, soup: BeautifulSoup, board: str, base_url: str, pattern: str) -> List[Dict[str, Any]]:
        """Extract paper information from the parsed HTML"""
        papers = []
        
        # Find all links that might be question papers
        for link in soup.find_all('a'):
            href = link.get('href')
            text = link.get_text().strip()
            
            # Skip if link is empty or doesn't contain text
            if not href or not text:
                continue
                
            # Check if the link text matches our pattern
            if re.search(pattern, text, re.IGNORECASE):
                # Create absolute URL if it's relative
                file_url = urljoin(base_url, href)
                
                # Extract year, subject and other metadata
                paper_info = self._extract_paper_metadata(text, file_url, board)
                if paper_info:
                    papers.append(paper_info)
                    self._download_paper(paper_info)
        
        logger.info(f"Found {len(papers)} papers for {board}")
        return papers
    
    def _extract_paper_metadata(self, text: str, file_url: str, board: str) -> Optional[Dict[str, Any]]:
        """Extract metadata about the paper from the link text"""
        # Try to extract year
        year_match = re.search(r'(19|20)\d{2}', text)
        year = year_match.group(0) if year_match else "Unknown"
        
        # Try to extract subject
        subjects = [
            "Mathematics", "Physics", "Chemistry", "Biology", "Science", 
            "English", "Hindi", "Social Science", "History", "Geography",
            "Economics", "Computer Science", "Accountancy", "Business Studies"
        ]
        
        subject = "Unknown"
        for s in subjects:
            if re.search(s, text, re.IGNORECASE):
                subject = s
                break
        
        # Try to extract class/standard
        class_match = re.search(r'(Class|Standard)\s*(\d{1,2})(th)?', text, re.IGNORECASE)
        standard = class_match.group(2) if class_match else "Unknown"
        
        # Create a unique ID
        file_name = os.path.basename(urlparse(file_url).path)
        paper_id = f"{board}_{subject}_{year}_{standard}_{file_name}"
        
        return {
            "id": paper_id,
            "board": board,
            "subject": subject,
            "year": year,
            "standard": standard,
            "url": file_url,
            "title": text,
            "file_name": file_name,
            "scraped_at": datetime.now().isoformat()
        }
    
    def _download_paper(self, paper_info: Dict[str, Any]) -> bool:
        """Download the paper file"""
        file_path = os.path.join(DOWNLOAD_DIR, paper_info["file_name"])
        
        # Skip if already downloaded
        if os.path.exists(file_path):
            logger.info(f"File already exists: {file_path}")
            return True
        
        try:
            response = requests.get(paper_info["url"], timeout=30, stream=True)
            response.raise_for_status()
            
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    
            logger.info(f"Downloaded: {file_path}")
            return True
        except Exception as e:
            logger.error(f"Download failed for {paper_info['url']}: {str(e)}")
            return False
    
    def _save_to_json(self, board: str, papers: List[Dict[str, Any]]) -> None:
        """Save paper metadata to a JSON file"""
        file_path = os.path.join(METADATA_DIR, f"{board}_papers.json")
        
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(papers, f, indent=2)
            logger.info(f"Saved metadata to {file_path}")
        except Exception as e:
            logger.error(f"Failed to save metadata: {str(e)}")
    
    def analyze_results(self):
        """Analyze the scraped data and generate statistics"""
        all_papers = []
        
        for board in SCRAPING_URLS.keys():
            file_path = os.path.join(METADATA_DIR, f"{board}_papers.json")
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        papers = json.load(f)
                        all_papers.extend(papers)
                except Exception as e:
                    logger.error(f"Failed to load {file_path}: {str(e)}")
        
        if not all_papers:
            logger.warning("No papers found for analysis")
            return {}
        
        # Convert to DataFrame for easier analysis
        df = pd.DataFrame(all_papers)
        
        # Generate statistics
        stats = {
            "total_papers": len(df),
            "papers_by_board": df['board'].value_counts().to_dict(),
            "papers_by_subject": df['subject'].value_counts().to_dict(),
            "papers_by_year": df['year'].value_counts().to_dict(),
            "papers_by_standard": df['standard'].value_counts().to_dict()
        }
        
        # Save statistics
        stats_path = os.path.join(METADATA_DIR, "statistics.json")
        try:
            with open(stats_path, 'w', encoding='utf-8') as f:
                json.dump(stats, f, indent=2)
            logger.info(f"Saved statistics to {stats_path}")
        except Exception as e:
            logger.error(f"Failed to save statistics: {str(e)}")
        
        return stats

def main():
    """Main function to execute the scraping process"""
    logger.info("=== Starting Board Exam PYQ Scraper ===")
    
    try:
        # Create and run the scraper
        scraper = BoardExamScraper()
        results = scraper.scrape_all_boards()
        
        # Analyze the results
        stats = scraper.analyze_results()
        
        # Print summary
        total_papers = sum(len(board_papers) for board_papers in results.values())
        logger.info(f"Scraping completed. Found {total_papers} papers across {len(results)} boards.")
        
        if stats:
            logger.info(f"Statistics Summary:")
            for board, count in stats.get('papers_by_board', {}).items():
                logger.info(f"  {board}: {count} papers")
                
            print("\n=== SCRAPING RESULTS SUMMARY ===")
            print(f"Total papers found: {total_papers}")
            for board, count in stats.get('papers_by_board', {}).items():
                print(f"{board}: {count} papers")
            print(f"\nFiles downloaded to: {os.path.abspath(DOWNLOAD_DIR)}")
            print(f"Metadata saved to: {os.path.abspath(METADATA_DIR)}")
            print("============================")
        
    except Exception as e:
        logger.error(f"Scraping process failed: {str(e)}")
    finally:
        # Ensure the browser is closed
        if hasattr(scraper, 'close_browser'):
            scraper.close_browser()
    
    logger.info("=== Board Exam PYQ Scraper Finished ===")

if __name__ == "__main__":
    main()