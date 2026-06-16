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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![sync_window_theme]);

    #[cfg(desktop)]
    let builder = builder.menu(|app| Menu::default(app));

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_window_state::Builder::default().build());

    builder
        .setup(|app| {

            #[cfg(target_os = "macos")]
            if let Some(window) = app.get_webview_window("main") {
                use tauri::TitleBarStyle;

                window.set_title_bar_style(TitleBarStyle::Transparent)?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
