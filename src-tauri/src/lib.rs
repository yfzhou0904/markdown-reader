#[cfg(desktop)]
use tauri::menu::Menu;
use tauri::{Manager, WebviewWindow};

#[tauri::command]
fn sync_window_theme(
    window: WebviewWindow,
    theme: &str,
    red: u8,
    green: u8,
    blue: u8,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use tauri::{window::Color, Theme};

        let native_theme = match theme {
            "dark" => Theme::Dark,
            "light" | "paper" => Theme::Light,
            _ => return Err(format!("unsupported theme: {theme}")),
        };

        window
            .set_theme(Some(native_theme))
            .map_err(|error| error.to_string())?;

        window
            .set_background_color(Some(Color(red, green, blue, 255)))
            .map_err(|error| error.to_string())?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (window, theme, red, green, blue);
    }

    Ok(())
}

/// Returns true if any part of the window's frame intersects a monitor's work
/// area. Used to detect windows restored to an unreachable, off-screen position.
fn window_is_on_screen(window: &WebviewWindow) -> bool {
    let (Ok(pos), Ok(size), Ok(monitors)) =
        (window.outer_position(), window.outer_size(), window.available_monitors())
    else {
        return true; // If we can't tell, don't move the window.
    };

    let win_left = pos.x;
    let win_top = pos.y;
    let win_right = pos.x + size.width as i32;
    let win_bottom = pos.y + size.height as i32;

    monitors.iter().any(|monitor| {
        let mpos = monitor.position();
        let msize = monitor.size();
        let m_left = mpos.x;
        let m_top = mpos.y;
        let m_right = mpos.x + msize.width as i32;
        let m_bottom = mpos.y + msize.height as i32;

        win_left < m_right && win_right > m_left && win_top < m_bottom && win_bottom > m_top
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![sync_window_theme]);

    #[cfg(desktop)]
    let builder = builder.menu(|app| Menu::default(app));

    #[cfg(desktop)]
    let builder = builder.plugin(
        tauri_plugin_window_state::Builder::default()
            // Never persist visibility: a window saved while hidden would be
            // restored hidden, leaving the app running with no recoverable window.
            .with_state_flags(
                tauri_plugin_window_state::StateFlags::all()
                    & !tauri_plugin_window_state::StateFlags::VISIBLE,
            )
            .build(),
    );

    builder
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                #[cfg(target_os = "macos")]
                {
                    use tauri::TitleBarStyle;

                    window.set_title_bar_style(TitleBarStyle::Transparent)?;
                }

                // Make sure the restored window is on a visible monitor; if the
                // saved geometry lands fully off-screen, recenter it.
                if !window_is_on_screen(&window) {
                    let _ = window.center();
                }

                window.show()?;
                window.set_focus()?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
