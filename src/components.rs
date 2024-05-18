//use html5ever::tree_builder::TreeSink;
use html_editor::operation::*;
use html_editor::{parse, Element, Node};
pub fn five() -> f64 {
    5.3
}

struct Component {
    name: &'static str,
    process: fn(Element) -> Vec<Node>,
}

const COMPONENTS: [Component; 1] = [Component {
    name: "xy-plot",
    process: xyPlot,
}];

fn xyPlot(e: Element) -> Vec<Node> {
    parse("<div>PLOT GOES HERE</div>").unwrap()
}

/*<div id="myDiv"></div>
<script type="text/rainy-loop-js">
  var trace1 = {
    x: globalRainyContext.xs,
    y: globalRainyContext.ys,
    type: 'scatter'
  };
  Plotly.newPlot('myDiv', [trace1]);
</script> */

pub fn process_components(html: &str) -> String {
    let mut fragment = parse(html).unwrap();
    //process_components_html(&mut fragment);

    for Component { name, process } in COMPONENTS {
        let selector = Selector::from(name);
        fragment = fragment.replace_with(&selector, |el| {
            let ns = process(el);
            ns[0]
        });
        //dbg!(fragment.select(&selector));
    }

    fragment.html()
}
/*fn process_components_html(fragment: &mut Html) {
    for Component { name, process } in COMPONENTS {
        let selector = scraper::Selector::parse(name).unwrap();

        //dbg!(fragment.select(&selector));
        for element in fragment.select(&selector) {
            let id = element.id()
            let h_substitute = process(element);
            fragment.remove_from_parent(&id);
            dbg!(element.value());
        }
    }
}*/
