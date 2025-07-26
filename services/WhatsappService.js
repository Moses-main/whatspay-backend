// services/WhatsAppService.js
const axios = require("axios");

class WhatsAppService {
  constructor() {
    // The base API URL for WhatsApp Cloud API, e.g., "https://graph.facebook.com/v17.0"
    this.apiUrl = process.env.WHATSAPP_API_URL;

    // Access token for authenticating with the WhatsApp API
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    // The unique phone number ID provided by WhatsApp Business API
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  /**
   * Sends a plain text WhatsApp message to a recipient.
   * @param {string} to - The recipient's phone number (in international format, e.g., "234...").
   * @param {string} message - The message body to send.
   * @returns {Object} - The response data from the WhatsApp API.
   */
  async sendMessage(to, message) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`, // API endpoint for sending messages
        {
          messaging_product: "whatsapp", // Required by WhatsApp API
          to: to, // Recipient's phone number
          type: "text", // Type of message
          text: { body: message }, // Message content
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`, // Authorization header with Bearer token
            "Content-Type": "application/json", // Content type is JSON
          },
        }
      );

      return response.data; // Return the API response data
    } catch (error) {
      // Log the error for debugging
      logger.error("Error sending WhatsApp message:", error);
      throw error; // Rethrow the error to be handled by the caller
    }
  }

  /**
   * Sends an interactive WhatsApp message with buttons (e.g., Yes/No).
   * @param {string} to - The recipient's phone number.
   * @param {string} header - The header text for the message.
   * @param {string} body - The body text of the interactive message.
   * @param {Array<string>} buttons - A list of button titles (e.g., ["Yes", "No"]).
   * @returns {Object} - The response data from the WhatsApp API.
   */
  async sendInteractiveMessage(to, header, body, buttons) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`, // API endpoint
        {
          messaging_product: "whatsapp", // Messaging product
          to: to, // Recipient's phone number
          type: "interactive", // Type of message (interactive with buttons)
          interactive: {
            type: "button", // Interactive element type
            header: { type: "text", text: header }, // Header text
            body: { text: body }, // Body text
            action: {
              // Map button titles to reply objects
              buttons: buttons.map((btn, index) => ({
                type: "reply",
                reply: {
                  id: `btn_${index}`, // Unique button ID
                  title: btn, // Button title (label)
                },
              })),
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`, // Auth header
            "Content-Type": "application/json", // Content type
          },
        }
      );

      return response.data;
    } catch (error) {
      // Log the error if sending fails
      logger.error("Error sending interactive message:", error);
      throw error; // Rethrow for the caller
    }
  }
}

module.exports = WhatsAppService;
