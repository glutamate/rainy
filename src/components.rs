//use html5ever::tree_builder::TreeSink;
use html_editor::operation::*;
use html_editor::{parse, Element, Node};
pub fn five() -> f64 {
    5.3
}
#[derive(Clone, Copy)]
struct Component {
    name: &'static str,
    process: fn(&Element) -> Vec<Node>,
}

const COMPONENTS: [Component; 1] = [Component {
    name: "xy-plot",
    process: xyPlot,
}];

fn xyPlot(_e: &Element) -> Vec<Node> {
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
    //dbg!(fragment);
    for component in COMPONENTS {
        fn visit(nodes: &mut Vec<Node>, comp: Component) {
            let Component { name, process } = comp;
            let selector = Selector::from(name);
            for node in nodes.iter_mut() {
                if let Node::Element(ref mut el) = node {
                    if selector.matches(el) {
                        let nodes = process(el);
                        if nodes.len() == 1 {
                            let new_node = nodes[0].clone();
                            *node = new_node;
                        } else {
                            let new_node = Node::Element(Element {
                                name: String::from("div"),
                                attrs: vec![],
                                children: nodes,
                            });
                            *node = new_node;
                        }
                    } else {
                        visit(&mut el.children, comp);
                        // el.replace_with(selector, f);
                    }
                }
            }
        }
        visit(&mut fragment, component);

        /*fragment = fragment.replace_with(&selector, |el| {
            let ns = process(el);
            ns[0]
        });*/
        //dbg!(fragment.select(&selector));
    }
    //fragment.html()
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
