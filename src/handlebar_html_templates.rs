use handlebars::Handlebars;
use html_editor::operation::*;
use html_editor::{parse, Element, Node};
use std::collections::BTreeMap;
#[derive(Clone, Copy)]
pub struct Template {
    pub name: &'static str,
    pub body: &'static str,
}

pub fn run_hht(html: &str, templates: Vec<Template>) -> String {
    let mut fragment = parse(html).unwrap();
    process_component_nodes(&mut fragment, &templates);

    fragment.html()
}

fn process_component_nodes(fragment: &mut Vec<Node>, templates: &Vec<Template>) {
    for template in templates {
        fn visit(nodes: &mut Vec<Node>, comp: Template, ts: &Vec<Template>) {
            let Template { name, body } = comp;
            let selector = Selector::from(name);
            for node in nodes.iter_mut() {
                if let Node::Element(ref mut el) = node {
                    if selector.matches(el) {
                        let mut nodes = process_template(el, name, body); // run handlebars here
                        process_component_nodes(&mut nodes, ts);
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
                        visit(&mut el.children, comp, ts);
                        // el.replace_with(selector, f);
                    }
                }
            }
        }
        visit(fragment, *template, templates);
        //}
    }
}

fn process_template(elem: &Element, name: &str, hb_body: &str) -> Vec<Node> {
    let mut handlebars = Handlebars::new();
    handlebars.register_template_string(name, hb_body).unwrap();
    let mut data = BTreeMap::new();
    data.insert("FOO".to_string(), "bar".to_string());
    let result = handlebars.render(name, &data).unwrap();
    return parse(&result).unwrap();
}
