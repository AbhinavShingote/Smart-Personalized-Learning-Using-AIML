// services/scheduler.js
const cron = require("node-cron");
const prisma = require("../config/db");
const { sendMail } = require("./mailService");

/**
 * Scan database for users at risk of losing their streak (lastActiveAt is 22-23 hours ago)
 * and send them an email reminder.
 */
async function sendStreakReminders() {
  console.log("⏰ [SCHEDULER] Running streak reminder checks...");
  const now = new Date();
  
  // Calculate window: 22 hours ago to 23 hours ago
  const minDate = new Date(now.getTime() - 23 * 60 * 60 * 1000);
  const maxDate = new Date(now.getTime() - 22 * 60 * 60 * 1000);

  try {
    const usersAtRisk = await prisma.user.findMany({
      where: {
        currentStreak: { gt: 0 },
        lastActiveAt: {
          gte: minDate,
          lte: maxDate,
        },
      },
    });

    console.log(`⏰ [SCHEDULER] Found ${usersAtRisk.length} user(s) at risk of losing their streak.`);

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    for (const user of usersAtRisk) {
      const currentStreak = user.currentStreak;
      const emailSent = await sendMail({
        to: user.email,
        subject: `🔥 Don't lose your ${currentStreak}-day learning streak, ${user.name}!`,
        text: `Keep your ${currentStreak}-day streak going! Log in to Smart Personalized Learning to complete today's goal: ${clientUrl}/dashboard`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 600px; color: #1e293b; text-align: center; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fafafa; margin: 0 auto;">
            <div style="font-size: 48px; margin-bottom: 16px;">🔥</div>
            <h2 style="color: #4f46e5; margin-bottom: 8px; font-family: sans-serif;">Keep the fire burning, ${user.name}!</h2>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; font-family: sans-serif;">
              You have an active <strong>${currentStreak}-day</strong> learning streak. Don't let it reset to 0!
            </p>
            <p style="font-size: 14px; color: #64748b; margin-bottom: 24px; font-family: sans-serif;">
              Log in to your dashboard now, resume your custom roadmaps, and complete your learning topics for today to keep your streak alive.
            </p>
            <div style="margin: 28px 0;">
              <a href="${clientUrl}/dashboard" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; font-family: sans-serif;">
                Resume Learning & Keep Streak →
              </a>
            </div>
            <p style="font-size: 12px; color: #94a3b8; font-family: sans-serif;">
              If you already completed your learning for today, you can safely ignore this reminder. Keep up the amazing work!
            </p>
          </div>
        `,
      });
      console.log(`⏰ [SCHEDULER] Sent streak reminder to ${user.email} (sent via SMTP: ${emailSent})`);
    }
  } catch (err) {
    console.error("❌ [SCHEDULER] Error checking/sending streak reminders:", err);
  }
}

/**
 * Initialize all cron schedulers
 */
function initScheduler() {
  console.log("⏰ [SCHEDULER] Initializing schedulers...");

  // Run streak reminder checks every hour (at minute 0)
  // Pattern: '0 * * * *'
  cron.schedule("0 * * * *", () => {
    sendStreakReminders();
  });

  console.log("⏰ [SCHEDULER] Streak reminder scheduled to run hourly.");
}

module.exports = { initScheduler, sendStreakReminders };
