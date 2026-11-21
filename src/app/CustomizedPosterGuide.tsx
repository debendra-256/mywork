import {
  Sparkles,
  Layers,
  Copy,
  Upload,
  Check,
  ShieldCheck,
  SlidersHorizontal,
  ArrowRight,
  Zap,
} from 'lucide-react'
import './CustomizedPosterGuide.css'

export function CustomizedPosterGuide() {
  return (
    <article className="dpg-guide-container" aria-label="How to create customized poster guide">
      {/* Article Header with proper H1 */}
      <header className="dpg-header">
        <span className="dpg-badge">
          <Sparkles size={13} /> CREATION GUIDE &amp; TUTORIAL
        </span>
        <h1 className="dpg-main-title">
          How to Create a Customized Political, Birthday or other event Poster Using ImgMojo
        </h1>
        <p className="dpg-lead">
          Create a professional political birthday poster with your own photograph, preferred party colours,
          party flag and personalized details. ImgMojo makes it easy to customize poster settings and generate
          an AI-ready prompt that you can use with ChatGPT.
        </p>
        <p className="dpg-sublead">
          Follow these simple steps to create your personalized birthday poster.
        </p>
      </header>

      {/* Steps List */}
      <div className="dpg-steps-flow">
        {/* Step 1 */}
        <section className="dpg-step-card" aria-labelledby="dpg-step-1">
          <div className="dpg-step-head">
            <span className="dpg-step-badge">Step 01</span>
            <div className="dpg-step-icon">
              <SlidersHorizontal size={18} />
            </div>
            <h2 id="dpg-step-1" className="dpg-step-title">
              Step 1: Customize Your Prompt and Poster Settings
            </h2>
          </div>
          <div className="dpg-step-body">
            <p>
              Start by selecting your preferred political birthday poster template from ImgMojo.
            </p>
            <p>
              Before generating your poster, customize the available settings:
            </p>
            <ul className="dpg-feature-list">
              <li>
                <strong>Poster Size:</strong> Choose your preferred poster dimensions, such as portrait, square or social media format.
              </li>
              <li>
                <strong>Party Flag:</strong> Select the political party flag or colour theme you want to display.
              </li>
              <li>
                <strong>Party Logo and Emblems:</strong> Choose the appropriate party logo or emblem from the available options.
              </li>
              <li>
                <strong>Dynamic Variables:</strong> Customize details such as person name, designation, birthday greeting, dress colour and wisher name.
              </li>
            </ul>
            <p className="dpg-note-text">
              These settings help personalize the poster according to your requirements.
            </p>

            {/* Step 1 Screenshot Mockup */}
            <div className="dpg-shot-frame" aria-label="Step 1 example screenshot">
              <div className="dpg-shot-titlebar">
                <div className="dpg-shot-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="dpg-shot-title">Example: ImgMojo · Customize Prompt &amp; Poster Settings</span>
              </div>
              <div className="dpg-shot-content">
                <div className="dpg-mock-card">
                  <div className="dpg-mock-head">
                    <span className="dpg-mock-chip">
                      <Sparkles size={11} /> Studio Customizer
                    </span>
                    <strong>Customize Prompt &amp; Poster Settings</strong>
                    <small>Select poster size, party flag &amp; customize variables in real-time</small>
                  </div>
                  <div className="dpg-mock-grid-4">
                    <div className="dpg-mock-item is-active">
                      <Layers size={14} />
                      <div>
                        <strong>1. Poster Size</strong>
                        <span>Portrait 4:5</span>
                      </div>
                      <span className="dpg-mock-check">✓</span>
                    </div>
                    <div className="dpg-mock-item is-active">
                      <Sparkles size={14} />
                      <div>
                        <strong>2. Party Flag</strong>
                        <span>Saffron &amp; Green</span>
                      </div>
                      <span className="dpg-mock-check">✓</span>
                    </div>
                    <div className="dpg-mock-item is-active">
                      <ShieldCheck size={14} />
                      <div>
                        <strong>3. Party Emblem</strong>
                        <span>Circular Badge</span>
                      </div>
                      <span className="dpg-mock-check">✓</span>
                    </div>
                    <div className="dpg-mock-item is-active">
                      <SlidersHorizontal size={14} />
                      <div>
                        <strong>4. Variables</strong>
                        <span>8 Fields Ready</span>
                      </div>
                      <span className="dpg-mock-check">✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 2 */}
        <section className="dpg-step-card" aria-labelledby="dpg-step-2">
          <div className="dpg-step-head">
            <span className="dpg-step-badge">Step 02</span>
            <div className="dpg-step-icon">
              <Layers size={18} />
            </div>
            <h2 id="dpg-step-2" className="dpg-step-title">
              Step 2: Select Your Poster Size
            </h2>
          </div>
          <div className="dpg-step-body">
            <p>
              Choose the poster size according to where you plan to share your design.
            </p>
            <p>
              ImgMojo provides ready-to-use aspect ratios and dimensions optimized for all major platforms:
            </p>
            <ul className="dpg-feature-list dpg-sizes-list">
              <li>
                <strong>Campaign / Event Poster (2:3 · 1000 × 1500):</strong> Ideal for political rally banners, campaign posters, flex printings and event announcements.
              </li>
              <li>
                <strong>Instagram Portrait (4:5 · 1080 × 1350):</strong> High-impact vertical format for Instagram and Facebook feeds.
              </li>
              <li>
                <strong>Instagram Story / Reel (9:16 · 1080 × 1920):</strong> Fullscreen mobile vertical layout for WhatsApp Status, Instagram Stories, and Reels.
              </li>
              <li>
                <strong>Instagram Post (Square 1:1 · 1080 × 1080):</strong> Standard square format for social media feeds and profile shares.
              </li>
              <li>
                <strong>Facebook Post (1.91:1 · 1200 × 628) &amp; Cover (16:9 · 1200 × 630):</strong> Standard landscape dimensions for Facebook posts and page headers.
              </li>
              <li>
                <strong>YouTube Thumbnail (16:9 · 1280 × 720):</strong> Widescreen format for YouTube video thumbnails and presentations.
              </li>
              <li>
                <strong>Twitter / X Post (16:9 · 1200 × 675):</strong> Optimized landscape ratio for Twitter / X timeline posts.
              </li>
              <li>
                <strong>LinkedIn Banner (4:1 · 1584 × 396):</strong> Ultra-wide panoramic header for professional LinkedIn profiles and company pages.
              </li>
              <li>
                <strong>Wide Banner / Hoarding (21:9 · 2560 × 1080):</strong> Cinematic ultra-wide ratio for outdoor hoardings, street banners, and stage backdrops.
              </li>
            </ul>
            <p className="dpg-note-text">
              Select the size that best suits your requirements before proceeding.
            </p>

            {/* Step 2 Screenshot Mockup */}
            <div className="dpg-shot-frame" aria-label="Step 2 example screenshot">
              <div className="dpg-shot-titlebar">
                <div className="dpg-shot-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="dpg-shot-title">Example: Selecting Poster Size from Dropdown</span>
              </div>
              <div className="dpg-shot-content">
                <div className="dpg-dropdown-mockup">
                  <div className="dpg-dropdown-label-row">
                    <span className="dpg-dropdown-label">
                      <Layers size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                      Poster Size / Format
                    </span>
                    <span className="dpg-dropdown-tag">For Every Post</span>
                  </div>
                  <div className="dpg-dropdown-select-box">
                    <span>Campaign / Event Poster (2:3 · 1000 × 1500)</span>
                    <span className="dpg-dropdown-arrow">▼</span>
                  </div>
                  <div className="dpg-dropdown-menu-list">
                    <div className="dpg-menu-item default">-- Select Poster Size (Default) --</div>
                    <div className="dpg-menu-item">Instagram Post (Square 1:1 · 1080 × 1080)</div>
                    <div className="dpg-menu-item">Instagram Portrait (4:5 · 1080 × 1350)</div>
                    <div className="dpg-menu-item">Instagram Story / Reel (9:16 · 1080 × 1920)</div>
                    <div className="dpg-menu-item">Facebook Cover (16:9 · 1200 × 630)</div>
                    <div className="dpg-menu-item">Facebook Post (1.91:1 · 1200 × 628)</div>
                    <div className="dpg-menu-item">YouTube Thumbnail (16:9 · 1280 × 720)</div>
                    <div className="dpg-menu-item">Twitter / X Post (16:9 · 1200 × 675)</div>
                    <div className="dpg-menu-item">LinkedIn Banner (4:1 · 1584 × 396)</div>
                    <div className="dpg-menu-item is-highlighted">
                      <span>Campaign / Event Poster (2:3 · 1000 × 1500)</span>
                      <span className="dpg-menu-check">✓</span>
                    </div>
                    <div className="dpg-menu-item">Wide Banner / Hoarding (21:9 · 2560 × 1080)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 3 */}
        <section className="dpg-step-card" aria-labelledby="dpg-step-3">
          <div className="dpg-step-head">
            <span className="dpg-step-badge">Step 03</span>
            <div className="dpg-step-icon">
              <Sparkles size={18} />
            </div>
            <h2 id="dpg-step-3" className="dpg-step-title">
              Step 3: Select Party Flags, Logos and Emblems
            </h2>
          </div>
          <div className="dpg-step-body">
            <p>
              Choose the political party flag, logo or emblem you want to include in your poster by Drag drop.
            </p>
            <p>
              ImgMojo provides customization options to help match the poster's design with your preferred party identity.
            </p>
            <p>
              Select the appropriate available options and preview your selection before continuing.
            </p>
            <div className="dpg-legal-notice">
              <ShieldCheck size={15} />
              <span>Use party logos and emblems only when you have the appropriate rights or authorization.</span>
            </div>

            {/* Step 3 Screenshot Mockup */}
            <div className="dpg-shot-frame" aria-label="Step 3 example screenshot">
              <div className="dpg-shot-titlebar">
                <div className="dpg-shot-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="dpg-shot-title">Example: Party Logos &amp; Emblems Selection (Drag &amp; Drop Support)</span>
              </div>
              <div className="dpg-shot-content">
                <img
                  src="/images/guide/party-logos-emblems.png"
                  alt="Party Logos and Emblems Selection - Drag & Drop Support"
                  className="dpg-shot-img"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Step 4 */}
        <section className="dpg-step-card" aria-labelledby="dpg-step-4">
          <div className="dpg-step-head">
            <span className="dpg-step-badge">Step 04</span>
            <div className="dpg-step-icon">
              <ArrowRight size={18} />
            </div>
            <h2 id="dpg-step-4" className="dpg-step-title">
              Step 4: Click "Customize Prompt &amp; Copy"
            </h2>
          </div>
          <div className="dpg-step-body">
            <p>
              Once you have selected the poster size and party settings, click the{' '}
              <strong>Customize Prompt &amp; Copy</strong> button.
            </p>
            <p>
              This opens the prompt customization interface, where you can review and personalize the dynamic fields
              associated with your selected poster template.
            </p>

            {/* Step 4 Screenshot Reference */}
            <div className="dpg-shot-frame" aria-label="Step 4 reference screenshot">
              <div className="dpg-shot-titlebar">
                <div className="dpg-shot-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="dpg-shot-title">Reference: Customize &amp; Copy Prompt Modal Interface</span>
              </div>
              <div className="dpg-shot-content">
                <img
                  src="/images/guide/customize-copy-prompt-modal.png"
                  alt="Customize & Copy Prompt Review Dialog Reference"
                  className="dpg-shot-img"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Step 5 */}
        <section className="dpg-step-card" aria-labelledby="dpg-step-5">
          <div className="dpg-step-head">
            <span className="dpg-step-badge">Step 05</span>
            <div className="dpg-step-icon">
              <SlidersHorizontal size={18} />
            </div>
            <h2 id="dpg-step-5" className="dpg-step-title">
              Step 5: Verify and Customize Dynamic Variables
            </h2>
          </div>
          <div className="dpg-step-body">
            <p>
              Review all the available dynamic variables carefully.
            </p>
            <p>
              Depending on the selected template, these may include:
            </p>
            <div className="dpg-tags-cloud">
              <span className="dpg-var-tag">Person Name</span>
              <span className="dpg-var-tag">Dress Colour</span>
              <span className="dpg-var-tag">Stole Colour</span>
              <span className="dpg-var-tag">Designation</span>
              <span className="dpg-var-tag">Party Name</span>
              <span className="dpg-var-tag">Birthday Greeting</span>
              <span className="dpg-var-tag">Wisher Name</span>
              <span className="dpg-var-tag">Background Theme</span>
            </div>
            <p>
              Replace the default values with your preferred details.
            </p>
            <p>
              Check each field to make sure that names, designations, colours and greeting messages are correct.
            </p>
            <p className="dpg-note-text">
              Your customized values will be incorporated into the final AI image-generation prompt.
            </p>

            {/* Step 5 Screenshot Mockup */}
            <div className="dpg-shot-frame" aria-label="Step 5 example screenshot">
              <div className="dpg-shot-titlebar">
                <div className="dpg-shot-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="dpg-shot-title">Example: Dynamic Variables Form Editor</span>
              </div>
              <div className="dpg-shot-content">
                <div className="dpg-form-mockup">
                  <div className="dpg-form-row">
                    <div className="dpg-form-field">
                      <label>Person Name</label>
                      <input type="text" readOnly value="Shri Rajesh Kumar" />
                    </div>
                    <div className="dpg-form-field">
                      <label>Designation</label>
                      <input type="text" readOnly value="State Youth President" />
                    </div>
                  </div>
                  <div className="dpg-form-row">
                    <div className="dpg-form-field">
                      <label>Dress Colour</label>
                      <input type="text" readOnly value="Pure White Kurta Pajama" />
                    </div>
                    <div className="dpg-form-field">
                      <label>Stole Colour</label>
                      <input type="text" readOnly value="Saffron &amp; Green Party Stole" />
                    </div>
                  </div>
                  <div className="dpg-form-field">
                    <label>Birthday Greeting</label>
                    <input type="text" readOnly value="Heartiest Birthday Wishes to our Visionary Leader!" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 6 */}
        <section className="dpg-step-card" aria-labelledby="dpg-step-6">
          <div className="dpg-step-head">
            <span className="dpg-step-badge">Step 06</span>
            <div className="dpg-step-icon">
              <Copy size={18} />
            </div>
            <h2 id="dpg-step-6" className="dpg-step-title">
              Step 6: Click "OK" to Copy the Prompt and Open ChatGPT
            </h2>
          </div>
          <div className="dpg-step-body">
            <p>
              After verifying all the dynamic variables, click the <strong>OK</strong> button.
            </p>
            <p>
              ImgMojo will copy your customized prompt to the clipboard and automatically open ChatGPT in a new browser tab.
            </p>
            <p>
              Your customized prompt is now ready to use.
            </p>
            <p className="dpg-info-text">
              If ChatGPT asks you to sign in, complete the sign-in process and return to the conversation.
            </p>

            {/* Step 6 Screenshot Mockup */}
            <div className="dpg-shot-frame" aria-label="Step 6 example screenshot">
              <div className="dpg-shot-titlebar">
                <div className="dpg-shot-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="dpg-shot-title">Example: Confirmation Modal &amp; Auto-Open ChatGPT</span>
              </div>
              <div className="dpg-shot-content">
                <div className="dpg-modal-mockup">
                  <div className="dpg-modal-mock-head">
                    <div className="dpg-modal-mock-title">
                      <Sparkles size={14} />
                      <strong>Review Custom Prompt</strong>
                    </div>
                    <span className="dpg-modal-mock-badge">✓ 6 Changes Applied</span>
                  </div>
                  <div className="dpg-modal-mock-prompt">
                    <code>
                      Create an ultra-realistic 8K political birthday poster featuring Shri Rajesh Kumar (State Youth President), wearing a pure white kurta with saffron-green party stole, against a vibrant party celebration background...
                    </code>
                  </div>
                  <div className="dpg-modal-mock-footer">
                    <button type="button" className="dpg-mock-btn-cancel">Cancel</button>
                    <button type="button" className="dpg-mock-btn-ok">
                      <Check size={14} />
                      <span>OK (Copy Prompt &amp; Open ChatGPT)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 7 */}
        <section className="dpg-step-card" aria-labelledby="dpg-step-7">
          <div className="dpg-step-head">
            <span className="dpg-step-badge">Step 07</span>
            <div className="dpg-step-icon">
              <Upload size={18} />
            </div>
            <h2 id="dpg-step-7" className="dpg-step-title">
              Step 7: Upload Your Photograph and Paste the Prompt
            </h2>
          </div>
          <div className="dpg-step-body">
            <p>In ChatGPT:</p>
            <ol className="dpg-num-list">
              <li>Click the attachment or image upload option.</li>
              <li>Select the original photograph you want to feature in your birthday poster.</li>
              <li>Wait until the photograph is uploaded.</li>
              <li>Paste the customized prompt copied from ImgMojo into the message box.</li>
              <li>Review the instructions to ensure your photograph and personalized details are correctly referenced.</li>
            </ol>
            <div className="dpg-important-banner">
              <ShieldCheck size={16} />
              <div>
                <strong>Important:</strong> Use a clear, high-quality photograph for better results. The prompt
                should instruct the image-generation model to preserve the original person's facial identity and natural appearance.
              </div>
            </div>

            {/* Step 7 Screenshot Mockup */}
            <div className="dpg-shot-frame" aria-label="Step 7 example screenshot">
              <div className="dpg-shot-titlebar">
                <div className="dpg-shot-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="dpg-shot-title">Example: ChatGPT · Attach Photograph &amp; Paste Prompt</span>
              </div>
              <div className="dpg-shot-content">
                <div className="dpg-chatgpt-mockup">
                  <div className="dpg-chatgpt-attach-chip">
                    <span className="attach-icon">📎</span>
                    <span>rajesh-kumar-photo.jpg (2.8 MB)</span>
                    <span className="attach-tag">Reference Face</span>
                  </div>
                  <div className="dpg-chatgpt-input-box">
                    <p className="dpg-chatgpt-text">
                      Please generate a customized political birthday poster using the uploaded reference photograph. Preserve the person's exact facial identity, features, and expression. Apply the party colours, white kurta, and celebration typography as specified in the prompt...
                    </p>
                    <div className="dpg-chatgpt-input-footer">
                      <span className="dpg-chatgpt-model">ChatGPT · DALL-E / 4o Image Generation</span>
                      <button type="button" className="dpg-chatgpt-send-btn">
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 8 */}
        <section className="dpg-step-card" aria-labelledby="dpg-step-8">
          <div className="dpg-step-head">
            <span className="dpg-step-badge">Step 08</span>
            <div className="dpg-step-icon">
              <Zap size={18} />
            </div>
            <h2 id="dpg-step-8" className="dpg-step-title">
              Step 8: Generate Your Customized Birthday Poster
            </h2>
          </div>
          <div className="dpg-step-body">
            <p>
              Once your photograph and customized prompt are ready, submit the prompt in ChatGPT and request image generation.
            </p>
            <p>
              ChatGPT will use your instructions and uploaded reference photograph to create the personalized birthday poster.
            </p>
            <p>
              Review the generated result. If necessary, request adjustments to the background, colours, layout or text.
            </p>
            <p>
              When you are satisfied with the final design, save the generated image to your device.
            </p>

            {/* Step 8 Screenshot Mockup */}
            <div className="dpg-shot-frame" aria-label="Step 8 example screenshot">
              <div className="dpg-shot-titlebar">
                <div className="dpg-shot-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="dpg-shot-title">Example: Generated High-Resolution Birthday Poster</span>
              </div>
              <div className="dpg-shot-content">
                <div className="dpg-result-mockup">
                  <div className="dpg-result-poster-card">
                    <div className="dpg-result-poster-banner">
                      <span>★ OFFICIAL BIRTHDAY GREETING ★</span>
                    </div>
                    <div className="dpg-result-poster-body">
                      <div className="dpg-result-photo-placeholder">
                        <span className="face-icon">👤</span>
                        <strong>Shri Rajesh Kumar</strong>
                        <small>Youth General Secretary</small>
                      </div>
                      <div className="dpg-result-decorations">
                        <span className="badge-flag">🚩 Party Flag &amp; Emblem</span>
                        <span className="badge-bday">🎂 Happy Birthday!</span>
                      </div>
                    </div>
                  </div>
                  <div className="dpg-result-actions">
                    <button type="button" className="dpg-result-btn save">
                      <Upload size={13} style={{ transform: 'rotate(180deg)' }} /> Save HD Image
                    </button>
                    <button type="button" className="dpg-result-btn share">
                      <Copy size={13} /> Share on WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="dpg-congrats-card">
              <div className="dpg-congrats-icon">🎉</div>
              <div>
                <strong className="dpg-congrats-title">
                  Congratulations! Your personalized political birthday poster is ready to share.
                </strong>
                <p className="dpg-congrats-sub">
                  You can now share your creation on WhatsApp, Facebook, Instagram and other social media platforms.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Tips Section */}
      <section className="dpg-tips-card" aria-labelledby="dpg-tips-heading">
        <div className="dpg-tips-head">
          <div className="dpg-tips-icon">
            <Zap size={20} />
          </div>
          <h3 id="dpg-tips-heading" className="dpg-tips-title">
            Tips for Getting Better Results
          </h3>
        </div>
        <ul className="dpg-tips-list">
          <li>
            <Check size={15} />
            <span>Always upload a clear, high-resolution original photograph.</span>
          </li>
          <li>
            <Check size={15} />
            <span>Double-check all dynamic variables before copying the prompt.</span>
          </li>
          <li>
            <Check size={15} />
            <span>Verify the party flag and logo selection.</span>
          </li>
          <li>
            <Check size={15} />
            <span>Make sure the person's name and designation are spelled correctly.</span>
          </li>
          <li>
            <Check size={15} />
            <span>Ask the image-generation model to preserve the original facial identity.</span>
          </li>
          <li>
            <Check size={15} />
            <span>Review the generated poster before sharing it.</span>
          </li>
        </ul>
      </section>

      {/* Footer Callout */}
      <footer className="dpg-footer-cta">
        <h4 className="dpg-footer-title">
          Create More Personalized Posters with ImgMojo
        </h4>
        <p className="dpg-footer-text">
          Explore more political birthday poster templates on ImgMojo and customize your designs with different poster sizes, party themes, colours and personalized details.
        </p>
      </footer>
    </article>
  )
}
