use scraper::Html;

pub fn five() -> f64 {
    5.3
}

struct Component {
    name: &'static str,
    process: fn(Html) -> String,
}

const components: [Component; 1] = [Component {
    name: "xy-plot",
    process: (|h| String::from("Foo")),
}];

pub fn process_components(html: &str) -> &str {
    let fragment = Html::parse_fragment(html);

    let selector = scraper::Selector::parse("scatter").unwrap();

    //dbg!(fragment.select(&selector));
    for element in fragment.select(&selector) {
        dbg!(element.value());
    }

    "doo"
}
