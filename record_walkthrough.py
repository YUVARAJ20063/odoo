import os
import time
from playwright.sync_api import sync_playwright

def record():
    # Target directory to save final video
    dest_dir = r"c:\Users\yuvar\OneDrive\Documents\Projects\oddo\oddo"
    os.makedirs(dest_dir, exist_ok=True)
    
    # Working temp directory for video captures
    video_dir = os.path.join(os.getcwd(), "recordings_temp")
    os.makedirs(video_dir, exist_ok=True)

    with sync_playwright() as p:
        print("Launching headless Chromium browser...")
        browser = p.chromium.launch(headless=True)
        
        # Create context with high-res recording specs and bypass header
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            extra_http_headers={"bypass-tunnel-reminder": "true"},
            record_video_dir=video_dir,
            record_video_size={"width": 1280, "height": 720}
        )
        
        page = context.new_page()
        
        # Register dialog listener to auto-accept confirmation prompts
        page.on("dialog", lambda dialog: dialog.accept())
        
        try:
            # Navigate to local server
            print("Navigating to http://localhost:5173/ ...")
            page.goto("http://localhost:5173/", wait_until="networkidle")
            time.sleep(3)
            
            # Sign in as Admin
            print("Signing in using Admin preset...")
            page.click("button:has-text('Admin')")
            time.sleep(1.5)
            page.click("button:has-text('Sign In')")
            time.sleep(5)
            
            # Click Assets
            print("Visiting Assets page...")
            page.click("a:has-text('Assets')")
            time.sleep(4)
            
            # Click Employees
            print("Visiting Employees directory...")
            page.click("a:has-text('Employees')")
            time.sleep(4)
            
            # Click Bookings
            print("Visiting Booking scheduler...")
            page.click("a:has-text('Bookings')")
            time.sleep(4)
            
            # Click Maintenance
            print("Visiting Maintenance tracker...")
            page.click("a:has-text('Maintenance')")
            time.sleep(4)
            
            # Click Reports
            print("Visiting Reports dashboard...")
            page.click("a:has-text('Reports')")
            time.sleep(4)
            
            # Click Audits
            print("Visiting Auditing center...")
            page.click("a:has-text('Audits')")
            time.sleep(4)
            
            # Create a new Audit cycle with scope 'All'
            print("Creating a new Audit Cycle with 'All' scope...")
            page.click("button:has-text('New Audit Cycle')")
            time.sleep(2)
            page.fill("input[placeholder='e.g. Q3 IT Hardware Audit']", "Q3 Hardware Audit")
            time.sleep(1)
            # Select scopes and dates
            page.fill("input[type='date'] >> nth=0", "2026-07-12")
            page.fill("input[type='date'] >> nth=1", "2026-07-31")
            time.sleep(1)
            page.select_option("select >> nth=0", "All")
            time.sleep(1.5)
            # Select first auditor checkbox
            page.click("input[type='checkbox'] >> nth=0")
            time.sleep(1.5)
            # Launch cycle
            page.click("button:has-text('Launch Cycle')")
            time.sleep(4)
            
            # Click "Start Audit" on the draft cycle to activate it
            print("Activating the audit cycle...")
            page.click("button:has-text('Start Audit')")
            time.sleep(4)
            
            # Click the newly launched audit cycle to evaluate
            print("Selecting active cycle...")
            page.click("div[class*='cursor-pointer'] >> nth=0")
            time.sleep(3)
            
            # Submit evaluations
            print("Evaluating scoped assets...")
            page.click("button:has-text('Verified') >> nth=0")
            time.sleep(2.5)
            page.click("button:has-text('Damaged') >> nth=0")
            time.sleep(2.5)
            
            # Close cycle
            print("Closing cycle...")
            page.click("button:has-text('Close & Commit Cycle')")
            time.sleep(4)
            
            # Visit Settings
            print("Visiting System Settings...")
            page.click("a:has-text('Settings')")
            time.sleep(4)
            
            # View Tab A (Departments)
            print("Viewing Tab A - Departments...")
            page.click("button:has-text('Departments (Tab A)')")
            time.sleep(4)
            
            # View Tab B (Asset Categories)
            print("Viewing Tab B - Asset Categories...")
            page.click("button:has-text('Asset Categories (Tab B)')")
            time.sleep(4)
            
            # Sign out
            print("Signing out...")
            page.click("span:has-text('Logout')")
            time.sleep(2.5)
            
        except Exception as e:
            print(f"Exception during record: {e}")
            
        print("Finalizing video...")
        context.close()
        video_path = page.video.path()
        browser.close()
        
        # Copy output video to user's workspace
        final_video_name = "assetflow_project_walkthrough.webm"
        final_path = os.path.join(dest_dir, final_video_name)
        if os.path.exists(video_path):
            import shutil
            shutil.copy(video_path, final_path)
            print(f"Successfully saved demonstration video: {final_path}")
            shutil.rmtree(video_dir, ignore_errors=True)
        else:
            print("Error: Video capture path not found.")

if __name__ == "__main__":
    record()
