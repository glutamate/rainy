//use html5ever::tree_builder::TreeSink;
use markup5ever::interface::tree_builder::TreeSink;
use scraper::{element_ref::ElementRef, node::Element, Html};
pub fn five() -> f64 {
    5.3
}

struct Component {
    name: &'static str,
    process: fn(ElementRef) -> Html,
}

const COMPONENTS: [Component; 1] = [Component {
    name: "xy-plot",
    process: (|e| Html::parse_fragment("<div>PLOT GOES HERE</div>")),
}];

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
    let mut fragment = Html::parse_fragment(html);
    //process_components_html(&mut fragment);

    for Component { name, process } in COMPONENTS {
        let selector = scraper::Selector::parse(name).unwrap();

        //dbg!(fragment.select(&selector));

        for element in fragment.select(&selector) {
            let id = element.id();
            let h_substitute = process(element);
            fragment.append_before_sibling(&id, h_substitute)
            //dbg!(element.value());
        }
        let node_ids: Vec<_> = fragment.select(&selector).map(|x| x.id()).collect();
        for id in node_ids {
            fragment.remove_from_parent(&id);
        }
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
