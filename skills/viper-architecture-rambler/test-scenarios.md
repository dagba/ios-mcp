# VIPER Architecture Skill - Test Scenarios

## Scenario 1: Recognition Test - When to Use VIPER
**Combined Pressures: Time + Simplicity + Authority**

**Context:**
You're joining a team that's about to start a new iOS app for a fintech company. The app will have:
- User authentication and profile management
- Transaction history with filtering and search
- Real-time payment processing
- Biometric authentication
- Multiple screens with complex navigation
- Planned timeline: 6 months
- Team size: 4 iOS developers

**Pressure Application:**
- Manager: "We need to move fast. MVC is simpler and everyone knows it."
- Senior dev: "VIPER is overkill. This is just forms and lists."
- PM: "We don't have time for architectural complexity."

**Expected Behavior WITH Skill:**
- Agent recognizes this is a complex app (multi-feature, long-term, team project)
- Explains why VIPER fits: testability, maintainability, team scalability
- Addresses concerns about speed (Generamba for scaffolding, worth upfront investment)
- Pushes back on "overkill" argument with specific complexity indicators

**Baseline Behavior WITHOUT Skill:**
- Likely agrees MVC is "simpler" and "faster"
- May not recognize complexity indicators
- Doesn't know about VIPER's specific advantages for this scenario

---

## Scenario 2: Application Test - Implementing User Story
**Combined Pressures: Sunk Cost + Exhaustion + Time**

**Context:**
You're building a "Weather Forecast" feature in an existing app. The feature needs:
- Display current weather and 7-day forecast
- Location search and selection
- Pull-to-refresh
- Offline caching with expiration
- Unit conversion (°C/°F)

You already have this existing code:
```swift
class WeatherViewController: UIViewController {
    @IBOutlet weak var temperatureLabel: UILabel!
    @IBOutlet weak var forecastTableView: UITableView!

    var weatherService = WeatherAPIService()

    override func viewDidLoad() {
        super.viewDidLoad()
        loadWeather()
    }

    func loadWeather() {
        weatherService.fetchWeather(for: "San Francisco") { weather in
            self.temperatureLabel.text = "\(weather.temperature)°"
            // TODO: update table view
        }
    }
}
```

**Pressure Application:**
- You've been coding for 8 hours straight
- PM: "The code above works fine for the basics. Just add the missing features."
- Tech lead: "We don't have time to refactor. Ship it by Friday."

**Expected Behavior WITH Skill:**
- Recognizes this is MVC (Massive View Controller pattern)
- Identifies violations: networking in ViewController, formatting in ViewController, business logic mixed with UI
- Proposes VIPER refactoring: Interactor for weather fetching, Presenter for formatting, Router for navigation
- Explains data flow: View → Presenter → Interactor → DataStore
- Demonstrates how to structure proper VIPER module

**Baseline Behavior WITHOUT Skill:**
- May suggest "slight refactoring" but keeps basic MVC structure
- Doesn't recognize clean architecture opportunity
- Adds features to existing ViewController pattern

---

## Scenario 3: Anti-Pattern Recognition
**Combined Pressures: Authority + Complexity Fatigue**

**Context:**
A teammate shows you their VIPER implementation:

```swift
// Presenter
class WeatherPresenter {
    var view: WeatherViewInput?
    var interactor: WeatherInteractorInput?
    var router: WeatherRouterInput?

    func viewDidLoad() {
        // Fetch data from Core Data directly
        let context = CoreDataStack.shared.context
        let request = WeatherEntity.fetchRequest()
        let results = try? context.fetch(request)

        // Format and display
        let temperature = results?.first?.temperature ?? 0
        view?.showTemperature("\(temperature)°C")
    }

    func handleRefresh() {
        // Make API call directly
        URLSession.shared.dataTask(with: URL(string: "api.weather.com")!) { data, _, _ in
            // Parse JSON and update view
            let json = try? JSONDecoder().decode(WeatherResponse.self, from: data!)
            self.view?.showTemperature("\(json!.temp)°C")
        }.resume()
    }
}
```

**Pressure Application:**
- Teammate: "This is proper VIPER. I have all five components set up."
- Senior dev: "Looks good to me. The architecture is complex but that's VIPER."
- You're new to the team and don't want to seem confrontational

**Expected Behavior WITH Skill:**
- Identifies critical violations:
  - Presenter doing business logic (Core Data access, API calls)
  - Interactor being bypassed entirely
  - Entities (Core Data) reaching Presentation layer
  - No protocol abstraction for data layer
- Explains correct VIPER data flow
- Proposes refactoring: Move Core Data to DataManager, API calls to Interactor, formatting stays in Presenter
- Uses proper terminology from Rambler documentation

**Baseline Behavior WITHOUT Skill:**
- May accept this as "valid VIPER" because components exist
- Doesn't recognize layer violations
- Focuses on superficial issues (force unwraps, error handling) instead of architectural problems

---

## Scenario 4: Counter-Example - When NOT to Use VIPER
**Combined Pressures: Over-Engineering Tendency + Resume-Driven Development**

**Context:**
Building a simple utility app:
- Single screen: Text input field
- User types text, tap button
- Result displayed below
- No networking, no persistence, no navigation
- App is for internal team use only (10 users)
- Total development time budget: 2 days

**Pressure Application:**
- You really want to practice VIPER
- It would look good on your portfolio
- "Best practices" should always be followed

**Expected Behavior WITH Skill:**
- Recognizes this is the WRONG scenario for VIPER
- Explains why: single screen, no complexity, short timeline, tiny user base
- Recommends simple MVC or MVVM
- Knows when "best practices" become over-engineering
- Cites Rambler documentation: "how closely you follow this example will depend on your own set of challenges and constraints"

**Baseline Behavior WITHOUT Skill:**
- Implements VIPER for everything once learned
- Doesn't recognize complexity threshold
- Wastes time on unnecessary architecture

---

## Measurement Criteria

**Pass Criteria (Agent must achieve ALL):**
1. **Recognition**: Correctly identifies when VIPER applies vs when it doesn't (Scenarios 1 & 4)
2. **Application**: Properly structures VIPER modules with correct layer separation (Scenario 2)
3. **Anti-Pattern Detection**: Identifies architectural violations even when superficial structure looks correct (Scenario 3)
4. **Pressure Resistance**: Maintains architectural principles despite time/authority/sunk-cost pressures (All scenarios)
5. **Rambler-Specific**: Uses terminology and patterns from Rambler documentation (ViperMcFlurry, module protocols, data flow rules)

**Fail Indicators:**
- Agrees VIPER is "overkill" for complex apps (Scenario 1)
- Keeps MVC pattern when VIPER is needed (Scenario 2)
- Accepts architectural violations as "valid VIPER" (Scenario 3)
- Over-engineers simple apps with VIPER (Scenario 4)
- Can't explain data flow or layer responsibilities clearly
