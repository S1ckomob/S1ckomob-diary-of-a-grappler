import { useState } from "react";
import { C, FONTS, TABS, DEFAULT_USER } from "./constants.js";

// ── Screen imports (add as you build each one) ──
// import Splash       from "./components/Splash";
// import Feed         from "./components/Feed";
// import Search       from "./components/Search";
// import Diary        from "./components/Diary";
// import Community    from "./components/Community";
// import Profile      from "./components/Profile";
// import Notifications from "./components/Notifications";
// import DMs          from "./components/DMs";
// import Settings     from "./components/Settings";
// import EditProfile  from "./components/EditProfile";
// import LogSession   from "./components/LogSession";

// ─────────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────────
export default function App() {

  // ── Auth state ──
  const [screen, setScreen] = useState("splash"); // "splash" | "app"

  // ── Navigation ──
  const [activeTab, setActiveTab] = useState("home");

  // ── Overlay state ──
  const [overlay, setOverlay] = useState(null); // "notifications" | "dms" | "settings" | "editProfile" | "logSession" | null

  // ── User state ──
  const [userProfile, setUserProfile] = useState(DEFAULT_USER);

  // ── Notification / DM badge counts ──
  const [notifCount, setNotifCount] = useState(3);
  const [dmCount,    setDmCount]    = useState(3);

  // ── Shared helpers ──
  const openOverlay  = (name) => setOverlay(name);
  const closeOverlay = ()     => setOverlay(null);
  const goToApp      = ()     => setScreen("app");

  // ── Props bundle passed to every screen ──
  const sharedProps = {
    userProfile,
    setUserProfile,
    activeTab,
    setActiveTab,
    openOverlay,
    closeOverlay,
    notifCount,
    setNotifCount,
    dmCount,
    setDmCount,
  };

  // ── Render active tab ──
  const renderTab = () => {
    switch (activeTab) {
      case "home":      return <PlaceholderScreen label="Feed"      {...sharedProps} />;
      case "discover":  return <PlaceholderScreen label="Discover"  {...sharedProps} />;
      case "diary":     return <PlaceholderScreen label="Diary"     {...sharedProps} />;
      case "community": return <PlaceholderScreen label="Community" {...sharedProps} />;
      case "profile":   return <PlaceholderScreen label="Profile"   {...sharedProps} />;
      default:          return <PlaceholderScreen label="Feed"      {...sharedProps} />;
    }
  };

  // ── Render overlay ──
  const renderOverlay = () => {
    if (!overlay) return null;
    return (
      <div style={{
        position:   "fixed",
        inset:      0,
        background: C.bgOverlay,
        zIndex:     100,
        display:    "flex",
        flexDirection: "column",
      }}>
        <PlaceholderScreen label={overlay} {...sharedProps} />
        <button
          onClick={closeOverlay}
          style={{
            position:   "absolute",
            top:        16,
            right:      16,
            background: "none",
            border:     "none",
            color:      "#fff",
            fontSize:   24,
            cursor:     "pointer",
          }}
        >✕</button>
      </div>
    );
  };

  // ── Splash screen ──
  if (screen === "splash") {
    return (
      <div style={{
        minHeight:      "100vh",
        background:     C.bg,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        32,
        fontFamily:     FONTS.body,
      }}>
        {/* Logo placeholder — replace with <img src="/logo.png" /> */}
        <div style={{
          width:        240,
          height:       200,
          background:   "#1A1A1A",
          borderRadius: 16,
          marginBottom: 32,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          border:       `1px solid ${C.border}`,
        }}>
          <span style={{ color: C.red, fontFamily: FONTS.display, fontSize: 28, letterSpacing: 2 }}>
            DIARY OF A<br />GRAPPLER
          </span>
        </div>

        <p style={{
          color:      "#AAAAAA",
          fontSize:   15,
          textAlign:  "center",
          lineHeight: 1.6,
          maxWidth:   280,
          marginBottom: 40,
        }}>
          The training log, community, and analytics platform built for grapplers who take their game seriously.
        </p>

        <button
          onClick={goToApp}
          style={{
            width:        "100%",
            maxWidth:     280,
            padding:      "18px 0",
            background:   C.red,
            border:       "none",
            borderRadius: 40,
            color:        "#fff",
            fontFamily:   FONTS.display,
            fontSize:     17,
            letterSpacing: 2,
            cursor:       "pointer",
            marginBottom: 20,
          }}
        >
          START YOUR JOURNEY
        </button>

        <p style={{ color: "#555", fontSize: 13 }}>
          Already have an account?{" "}
          <span
            onClick={goToApp}
            style={{ color: C.red, cursor: "pointer" }}
          >
            Sign in
          </span>
        </p>
      </div>
    );
  }

  // ── Main App ──
  return (
    <div style={{
      minHeight:  "100vh",
      background: C.bg,
      fontFamily: FONTS.body,
      maxWidth:   480,
      margin:     "0 auto",
      position:   "relative",
      display:    "flex",
      flexDirection: "column",
    }}>

      {/* ── Header ── */}
      <div style={{
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "space-between",
        padding:         "14px 20px",
        borderBottom:    `1px solid ${C.border}`,
        position:        "sticky",
        top:             0,
        background:      C.bg,
        zIndex:          50,
      }}>
        <span style={{
          fontFamily:    FONTS.display,
          fontSize:      20,
          letterSpacing: 1.5,
          color:         C.red,
        }}>
          DIARY OF A GRAPPLER
        </span>

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {/* Edit / Post */}
          <button onClick={() => openOverlay("logSession")} style={iconBtn}>✎</button>

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button onClick={() => openOverlay("notifications")} style={iconBtn}>🔔</button>
            {notifCount > 0 && <Badge count={notifCount} />}
          </div>

          {/* DMs */}
          <div style={{ position: "relative" }}>
            <button onClick={() => openOverlay("dms")} style={iconBtn}>✉</button>
            {dmCount > 0 && <Badge count={dmCount} />}
          </div>
        </div>
      </div>

      {/* ── Active Screen ── */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 70 }}>
        {renderTab()}
      </div>

      {/* ── Bottom Nav ── */}
      <div style={{
        position:      "fixed",
        bottom:        0,
        left:          "50%",
        transform:     "translateX(-50%)",
        width:         "100%",
        maxWidth:      480,
        background:    C.bg,
        borderTop:     `1px solid ${C.border}`,
        display:       "flex",
        zIndex:        50,
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex:          1,
                padding:       "10px 0",
                background:    "none",
                border:        "none",
                cursor:        "pointer",
                display:       "flex",
                flexDirection: "column",
                alignItems:    "center",
                gap:           3,
              }}
            >
              <span style={{ fontSize: 18, color: active ? C.red : C.textDim }}>
                {tab.icon}
              </span>
              <span style={{
                fontSize:      9,
                fontWeight:    700,
                letterSpacing: 0.8,
                color:         active ? C.red : C.textDim,
                fontFamily:    FONTS.body,
              }}>
                {tab.label}
              </span>
              {active && (
                <div style={{
                  position:     "absolute",
                  bottom:       0,
                  width:        24,
                  height:       2,
                  background:   C.red,
                  borderRadius: 2,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Overlays ── */}
      {renderOverlay()}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Shared mini-components
// ─────────────────────────────────────────────

function Badge({ count }) {
  return (
    <div style={{
      position:      "absolute",
      top:           -6,
      right:         -6,
      background:    "#E8192C",
      color:         "#fff",
      borderRadius:  10,
      fontSize:      9,
      fontWeight:    700,
      minWidth:      16,
      height:        16,
      display:       "flex",
      alignItems:    "center",
      justifyContent:"center",
      padding:       "0 4px",
    }}>
      {count}
    </div>
  );
}

const iconBtn = {
  background: "none",
  border:     "none",
  color:      "#FFFFFF",
  fontSize:   18,
  cursor:     "pointer",
  padding:    4,
  position:   "relative",
};

// ─────────────────────────────────────────────
//  Placeholder screen — remove as real screens are added
// ─────────────────────────────────────────────
function PlaceholderScreen({ label, openOverlay }) {
  return (
    <div style={{
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      minHeight:      400,
      color:          "#333",
      gap:            12,
    }}>
      <div style={{ fontSize: 40 }}>📓</div>
      <div style={{
        fontFamily: FONTS.display,
        fontSize:   24,
        letterSpacing: 2,
        color:      "#333",
      }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 12, color: "#333" }}>
        Component not yet extracted
      </div>
    </div>
  );
}
