//
//  NeoScannerApp.swift
//  NeoScanner
//
//  Created by Gabriel Bo on 2/14/25.
//

import SwiftUI
import Firebase

@main
struct NeoScannerApp: App {
    
    // ✅ Use UIApplicationDelegateAdaptor to link AppDelegate
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

